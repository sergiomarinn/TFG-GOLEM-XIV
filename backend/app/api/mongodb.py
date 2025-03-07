from pymongo import MongoClient
import pymongo
import json
import os 

class MongoDBClient:
    def __init__(self, host=os.getenv("mongo"), port=27017):
        self.host = host
        self.port = port
        self.client = MongoClient(os.getenv("mongo"), port)
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
        print("Estoy en cambiar fichero, el niub es: " )
        self.database.collection.update_one(
            {"niub": id},
            {"$set": {
                "cursos.$[curso].practicas.$[practica].fichero": directorio}},
            array_filters=[
                {"curso.id": id_curs},
                {"practica.id": id_practica}
            ]
        )

    def correccion(self, id, id_curs, id_practica, info):

        print("Id", id)
        print("Id_curs", id_curs)
        print("Id_practica", id_practica)
        print("Info", info)
        self.database.collection.update_one(
            {"niub": id},
            {"$set": {
                "cursos.$[curso].practicas.$[practica].correccion": info}},
            array_filters=[
                {"curso.id": id_curs},
                {"practica.id": id_practica}
            ]
        )

    def clearDb(self, database):
        self.client.drop_database(database)

    def practicas(self, niub, practicas):

        practicas_ids = [p['id_practica'] for p in practicas]
        print("IDs Prácticas ",practicas_ids)
        cursos_ids = [p['id_curso'] for p in practicas]
        print("IDs Cursos ",cursos_ids)

        print("Niub", niub)
        query = {
            "niub": niub,
            "cursos.id": { "$in": cursos_ids},
            "cursos.practicas.id": { "$in": practicas_ids}
        }

        myCursor = self.database.collection.find(query)

        result = [
            {
                "curso_id": curso["id"],
                "practica_id": practica["id"],
                "fichero": practica["fichero"],
                "correccion": practica["correccion"]
            }
            for doc in myCursor
            for curso in doc.get("cursos", [])
            for practica in curso.get("practicas", [])
            if curso["id"] in cursos_ids and practica["id"] in practicas_ids
        ]
        print("Resultado", result)
        print("Prácticas mongo",json.dumps(result, default=str))

        return json.dumps(result, default=str)