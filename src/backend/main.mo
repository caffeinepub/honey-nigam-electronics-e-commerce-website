import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Storage "blob-storage/Storage";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import OutCall "http-outcalls/outcall";
import Stripe "stripe/stripe";
import Runtime "mo:core/Runtime";

actor {
  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Storage
  include MixinStorage();

  // User Profile Management
  public type UserProfile = {
    name : Text;
    email : Text;
    address : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Product Management
  public type Category = {
    #phones;
    #laptops;
    #accessories;
    #gadgets;
  };

  public type Product = {
    id : Text;
    name : Text;
    description : Text;
    price : Nat;
    category : Category;
    images : [Storage.ExternalBlob];
    inventory : Nat;
  };

  module Product {
    public func compare(p1 : Product, p2 : Product) : Order.Order {
      Text.compare(p1.name, p2.name);
    };
  };

  let products = Map.empty<Text, Product>();

  // Shopping Cart Management
  public type CartItem = {
    productId : Text;
    quantity : Nat;
  };

  public type Cart = {
    items : [CartItem];
  };

  let carts = Map.empty<Principal, Cart>();

  // Order Management
  public type Order = {
    id : Text;
    userId : Principal;
    items : [CartItem];
    total : Nat;
    createdAt : Time.Time;
  };

  let orders = Map.empty<Principal, List.List<Order>>();

  // Product Functions - Public access
  public query func getAllProducts() : async [Product] {
    products.values().toArray().sort();
  };

  public query func getProduct(id : Text) : async Product {
    switch (products.get(id)) {
      case (?product) { product };
      case (null) { Runtime.trap("Product not found") };
    };
  };

  public query func searchProducts(term : Text) : async [Product] {
    products.values().toArray().filter(
      func(product) {
        product.name.contains(#text term) or product.description.contains(#text term);
      }
    );
  };

  public query func getProductsByCategory(category : Category) : async [Product] {
    products.values().toArray().filter(
      func(product) { product.category == category }
    );
  };

  // Cart Functions - User must access only their own cart
  public query ({ caller }) func getCart() : async Cart {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access cart");
    };
    switch (carts.get(caller)) {
      case (?cart) { cart };
      case (null) { { items = [] } };
    };
  };

  public shared ({ caller }) func updateCart(cart : Cart) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update cart");
    };
    if (cart.items.size() == 0) {
      carts.remove(caller);
    } else {
      carts.add(caller, cart);
    };
  };

  // Order Functions - User must access only their own orders
  public query ({ caller }) func getOrderHistory() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view order history");
    };
    switch (orders.get(caller)) {
      case (?orderList) { orderList.toArray() };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func placeOrder(cart : Cart) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can place orders");
    };

    let total = cart.items.foldLeft(
      0,
      func(acc, item) {
        switch (products.get(item.productId)) {
          case (?product) { acc + (product.price * item.quantity) };
          case (null) { acc };
        };
      },
    );

    if (cart.items.size() == 0) {
      Runtime.trap("Cart is empty");
    };

    let orderId = caller.toText().concat(Time.now().toText());
    let newOrder : Order = {
      id = orderId;
      userId = caller;
      items = cart.items;
      total;
      createdAt = Time.now();
    };

    // Update orders Map
    let existingOrders = switch (orders.get(caller)) {
      case (?existing) { existing };
      case (null) { List.empty<Order>() };
    };
    existingOrders.add(newOrder);
    orders.add(caller, existingOrders);

    // Update inventory
    for (item in cart.items.values()) {
      switch (products.get(item.productId)) {
        case (?product) {
          let updatedProduct = {
            id = product.id;
            name = product.name;
            description = product.description;
            price = product.price;
            category = product.category;
            images = product.images;
            inventory = product.inventory - item.quantity;
          };
          products.add(updatedProduct.id, updatedProduct);
        };
        case (null) {};
      };
    };

    // Clear cart after order placement
    carts.remove(caller);

    orderId;
  };

  // Admin Functions - Product Management
  public shared ({ caller }) func addProduct(product : Product) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add products");
    };
    products.add(product.id, product);
  };

  public shared ({ caller }) func updateProduct(product : Product) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update products");
    };
    products.add(product.id, product);
  };

  public shared ({ caller }) func deleteProduct(productId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };
    products.remove(productId);
  };

  // Admin function to view any user's order history
  public query ({ caller }) func getUserOrderHistory(user : Principal) : async [Order] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view other users' order history");
    };
    switch (orders.get(user)) {
      case (?orderList) { orderList.toArray() };
      case (null) { [] };
    };
  };

  // Stripe integration
  var configuration : ?Stripe.StripeConfiguration = null;

  public query func isStripeConfigured() : async Bool {
    configuration != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    configuration := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (configuration) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };
};
