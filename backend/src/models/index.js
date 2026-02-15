const User = require('./User');
const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const StockLog = require('./StockLog');

// User - Order ilişkisi
User.hasMany(Order, { foreignKey: 'user_id', as: 'siparisler' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'kullanici' });

// Order - OrderItem ilişkisi
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'kalemler', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'siparis' });

// Product - OrderItem ilişkisi
Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'siparis_kalemleri' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'urun' });

// Product - StockLog ilişkisi
Product.hasMany(StockLog, { foreignKey: 'product_id', as: 'stok_hareketleri' });
StockLog.belongsTo(Product, { foreignKey: 'product_id', as: 'urun' });

// User - StockLog ilişkisi
User.hasMany(StockLog, { foreignKey: 'user_id', as: 'stok_islemleri' });
StockLog.belongsTo(User, { foreignKey: 'user_id', as: 'kullanici' });

// Order - StockLog ilişkisi
Order.hasMany(StockLog, { foreignKey: 'order_id', as: 'stok_hareketleri' });
StockLog.belongsTo(Order, { foreignKey: 'order_id', as: 'siparis' });

module.exports = {
  User,
  Product,
  Order,
  OrderItem,
  StockLog
};
