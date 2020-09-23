from nltk import tokenize,pos_tag
from nltk.corpus import stopwords
from string import punctuation
from nltk.stem.porter import PorterStemmer
from nltk.corpus import wordnet as wn
from pymongo import MongoClient
pst = PorterStemmer()
from create_modify_sample_db import create_user_collection,create_transactions_collection

import json
import sys
try:
	connection = MongoClient(host = ["localhost:27017"],serverSelectionTimeoutMS = 8000)

	db = connection['mydb']
	user_coll = db['user']
	transactions_coll = db['transactions']

	if 'mydb' not in connection.database_names():
		create_user_collection(user_coll)
		create_transactions_collection(transactions_coll)
	# print([x for x in user_coll.find()])
except:
	print(json.dumps({"result_code":1,"result":"connection error"}))
	exit(0)

def get_mongo_query(query):

	try:
		pos_tagged_tokens = preprocess_query(query)
		selection,condition = get_selection_condition(pos_tagged_tokens)


		collection,selection_field = get_selection(selection)
		condition_field,condition_value = get_condition(collection,condition)
		parsed_query = {}
		
		if condition_field != "NULL": 
			if condition_value.isnumeric():
				condition_value = int(condition_value)
			parsed_query[condition_field] = condition_value
		result = [] 

		coll = db[collection]
		for x in coll.find(parsed_query):
			result.append(x[selection_field])
		print(json.dumps({"result_code":0,"result_type":selection_field,"result":result}))
	except:
		print(json.dumps({"result_code":1,"result":"some error occurred or no result found"}))

def preprocess_query(sentence):
	# sentence = sentence.lower()
	tokens = tokenize.word_tokenize(sentence)
	filtered_tokens = [token for token in tokens if token not in punctuation]
	pos_tagged_tokens = pos_tag(filtered_tokens)
	return pos_tagged_tokens


def get_selection_condition(pos_tagged_tokens):
	wh_index = [pos_tagged_tokens.index(word) for word in pos_tagged_tokens if word[1] in ["WDT","WRB","WP"] or word[0] in ["with","for","to","from","of","in"]]
	selection = []
	condition = []
	if wh_index == []:
		selection = pos_tagged_tokens
	else:
		selection = pos_tagged_tokens[:wh_index[-1]]
		condition = pos_tagged_tokens[wh_index[-1]:]
	return selection,condition


def get_selection(selection):
	default_collection = "user"
	collection = ""
	collection_names = ["user","transactions"]
	for word in selection:
		if word[1] in ["NN", "NNP", "NNS","VB"]:
			for collection_name in collection_names:
				if pst.stem(word[0]) in pst.stem(collection_name):
					collection = collection_name
	if collection == "":
		collection = default_collection


	fields = get_fields_collection(collection)
	possible_fields = []

	for word in selection:
		if word[1] in ["NN", "NNP", "NNS","VB"]:       #remainder is a verb?
			for field in fields:
				possible_fields.append(match_field_word(field,word[0]))
	possible_fields.sort()

	# print(possible_fields)


	if len(possible_fields)>1 and possible_fields[-1][0] == possible_fields[-2][0]:
		for field in fields:
			possible_fields.append(subset_count(selection,field))
		possible_fields.sort()
		return collection,possible_fields[-1][1]



	else: return collection,possible_fields[-1][1]





def get_fields_collection(collection_name):
	if collection_name == "user":
		return ["account_number","balance"]
	elif collection_name == "transactions":
		return ["account_from","account_to","money"]


def get_condition(collection,condition):

	if condition == []:
		return "NULL","NULL"



	fields = get_fields_collection(collection)
	condition_field = ""
	condition_value = None
	possible_fields = []
	for word in condition:
		if word[1] in ["NN", "NNP", "NNS","VB"]:     # account VB?
			for field in fields:
				possible_fields.append(match_field_word(field,word[0]))
	possible_fields.sort()

	if len(possible_fields)>1 and possible_fields[-1][0] == possible_fields[-2][0]:
		for field in fields:
			possible_fields.append(subset_count(condition,field))
		possible_fields.sort()
	condition_field = possible_fields[-1][1]

	for word in condition:
		for word in [w[0] for w in condition if w[1] in ["NN","NNS","NNP","CD"]]:
			if pst.stem(word[0]) not in pst.stem(condition_field):
				condition_value = word

	return condition_field,condition_value



def match_field_word(field,word):
	if word in field:
		return [1.0,field]
	if pst.stem(word) in pst.stem(field):
		return [1.0,field]
	constituent_words = [field]
	breaker = ""
	for i in field:
		if not i.isalpha():
			breaker = i
	if breaker != "":
		constituent_words = [field.split(breaker)[0]]
	max_similarity = 0
	for constituent_word in constituent_words:
		for field_synset in wn.synsets(constituent_word):
			for word_synset in wn.synsets(word):
				if word_synset.path_similarity(field_synset) != None:
					max_similarity = max(max_similarity,word_synset.path_similarity(field_synset))
	return [max_similarity,field]


def subset_count(sentence,field):

	constituent_words = [field]	
	breaker = ""
	for i in field:
		if not i.isalpha():
			breaker = i
	if breaker != "":
		constituent_words = field.split(breaker)

	X_set = {w[0] for w in sentence}  
	Y_set = {w for w in constituent_words} 
	intersect = X_set.intersection(Y_set)
	return [len(intersect),field]

# print("256".isnumeric())

# string = "money in account number 256"
# string = "account_number"

with open("sample_queries.txt") as f:
    content = f.readlines()
# you may also want to remove whitespace characters like `\n` at the end of each line
query_list = [x.strip() for x in content] 

for query in query_list:
	get_mongo_query(query)

# if len(sys.argv) > 1:
# 	string = sys.argv[1]
# get_mongo_query(string)

# connection.drop_database('mydb')

#scp -r -P 8888 ./recorder_3 debdan@srivalab-compute.cse.iitk.ac.in:sample_project
