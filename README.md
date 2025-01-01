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


## Add the Replica Set Configuration:

Look for the section labeled replication. If it doesn’t exist, you can add it yourself. Modify or add the following:
yaml

replication:
  replSetName: rs0

This ensures that MongoDB will always start with the replica set rs0 every time it is started.

Restart MongoDB Service:

After editing the configuration file, you need to restart MongoDB for the changes to take effect.

On Windows:

Open Command Prompt as an administrator and run:
bash

net stop MongoDB
net start MongoDB

### start mongo with replica
mongod --replSet rs0 --dbpath "C:/Program Files/MongoDB/Server/4.0/data"
mongod --replSet rs0 --dbpath "D:\coding\24\mongod\data"


Steps to Configure the Replica Set:
Connect to the MongoDB shell: Open a new terminal or command prompt and run the MongoDB shell:

mongo

Initialize the replica set: Once inside the MongoDB shell, initialize the replica set with the following command:


rs.initiate()

Verify the replica set status: After initiating, you can check the status with:


rs.status()



use admin  # Switch to the 'admin' database where user credentials are typically stored
db.auth("admin", "JI21ko87.")  # Authenticate with your username and password