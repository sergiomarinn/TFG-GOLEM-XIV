from pymongo import MongoClient
import pymongo
import json

class MongoDBClient:
    def __init__(self, host="mongodb+srv://mongodb:mongodb@cluster0.dwtsv2t.mongodb.net/", port=27017):
        self.host = host
        self.port = port
        self.client = MongoClient(host, port)
        self.database = None
        self.collection = None
    
    def close(self):
        self.client.close()
    
    def ping(self):
        return self.client.db_name.command('ping')
    
    def getDatabase(self, database):
        self.database = self.client[database]
        return self.database

    
    def clearDb(self,database):
        self.client.drop_database(database)
