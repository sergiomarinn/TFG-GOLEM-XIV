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

    def getCollection(self, collection):
        self.collection = self.database[collection]
        self.database.collection = self.collection
        return self.collection

    def set(self, col, nom):
        data = {
            "niub": nom,
            "cursos": []
        }
        col.insert_one(data)

    def push_curso(self, id, id_curs):
        self.database.collection.update_one(
            {"niub": id}, {"$push": {"cursos": {"id": id_curs, "practicas": []}}})

    def push_practicas(self, id, id_curs, id_practica):
        self.database.collection.update_one({"niub": id},
                                            {"$push": {"cursos.$[curso].practicas": {
                                                "id": id_practica, "fichero": "", "correccion": {}}}},
                                            array_filters=[{"curso.id": id_curs}])

    def cambiar_direccion_fichero(self, id, id_curs, id_practica, directorio):
        print(id, id_curs, id_practica, directorio)
        self.database.collection.update_one(
            {"niub": id},
            {"$set": {
                "cursos.$[curso].practicas.$[practica].fichero": directorio}},
            array_filters=[
                {"curso.id": id_curs},
                {"practica.id": id_practica}
            ]
        )

    def clearDb(self, database):
        self.client.drop_database(database)
