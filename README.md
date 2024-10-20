# WORKING WITH MONGO 
use {db}
## delete all orders and refresh the index to not submit duplicate orders                                                                                                                                                                              
db.orders.dropIndex({ date: 1 })                                             
db.orders.createIndex({ date: 1 }, { unique: true })
## Delete 
db.orders.deleteMany({})
### completley remove all and indexes
db.orders.drop()
## show
db.orders.find().pretty()



start mongo with replica
mongod --replSet rs0 --dbpath "C:/Program Files/MongoDB/Server/4.0/data"