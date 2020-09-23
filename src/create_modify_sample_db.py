from pymongo import MongoClient



# client = MongoClient("localhost",27017)
# db = client['mydb']
# print("Database created........")

# #Verification
# print("List of databases after creating new one")
# print(client.list_database_names())

# coll = db['user']

#Inserting document into a collection
# doc1 = {"name": "Ram", "age": "26", "city": "Hyderabad"}
# coll.insert_one(doc1)
# print(coll.find_one())
def create_user_collection(coll):
	documents = [{
		"account_number": 128,
		"balance": 500
	},
	{
		"account_number": 256,
		"balance": 1000
	},
	{
		"account_number": 512,
		"balance": 1500
	},
	{
		"account_number": 1024,
		"balance": 2000
	}]

	for doc in documents:
		coll.insert_one(doc)


# print(coll.find())

# collection = transactions
# {
# 	account_from: 512
# 	account_to: 256
# 	money_transferred: 500
# }
# collection = transactions
# {
# 	account_from: 128
# 	account_to: 1024
# 	money_transferred: 1000
# }

def create_transactions_collection(coll):
	documents = [{
		"account_from": 1000,
		"account_to": 256,
		"money_transferred": 500
	},
	{
		"account_from": 128,
		"account_to": 1024,
		"money_transferred": 1000
	},
	{
		"account_from": 512,
		"account_to": 1024,
		"money_transferred": 110
	},
	{
		"account_from": 256,
		"account_to": 128,
		"money_transferred": 1000
	}]

	for doc in documents:
		coll.insert_one(doc)