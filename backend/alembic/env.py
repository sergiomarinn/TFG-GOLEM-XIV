#Se usa para configurar el sistema de logging (registro de eventos) desde un archivo de configuración, 
#facilitando el seguimiento y monitoreo del proceso de migración.
from logging.config import fileConfig

#Importa la función engine_from_config, que construye un motor de base de datos (engine) 
#a partir de la configuración de Alembic.
from sqlalchemy import engine_from_config


#Responsable de gestionar las conexiones a la base de datos
from sqlalchemy import pool


#Importa los modelos del proyecto, estos modelos contienen la definición de las tablas y 
#su estructura en SQLAlchemy. Se necesita para las migraciones automáticas.
from api import models


#Importa el objeto context de Alembic, que proporciona el 
#contexto en el que se ejecutan las migraciones (offline u online).
from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config


#Interpret the config file for Python logging.
#This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = models.Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


#Esta función es para ejecutar las migraciones en modo offline, es decir, 
#sin establecer una conexión activa a la base de datos.
def run_migrations_offline() -> None:

    #Obtiene la URL de la base de datos del archivo de configuración alembic.ini. 
    #Esto indica dónde están ubicados los datos de conexión.
    url = config.get_main_option("sqlalchemy.url")

    #Configura el contexto de Alembic para usar la URL y los metadatos. 
    #literal_binds=True asegura que los valores se incrusten directamente en las consultas SQL generadas.
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    #Inicia una transacción para la migración.
    with context.begin_transaction():
        #Ejecuta las migraciones en modo offline, lo que genera un script SQL con los cambios, 
        #pero no aplica estos cambios directamente a la base de datos.
        context.run_migrations()


#Esta función es para ejecutar las migraciones en modo online, donde se establece una conexión activa 
#con la base de datos y las migraciones se ejecutan directamente.
def run_migrations_online() -> None:
    #Crea un motor de SQLAlchemy basado en la configuración del archivo alembic.ini
    #Usa NullPool para no utilizar ningún pooling de conexiones, ya que no se reutilizan conexiones.
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    #Se conecta a la base de datos y obtiene un objeto de conexión.
    with connectable.connect() as connection:
        #Configura Alembic para ejecutar las migraciones en la conexión establecida. 
        #Se pasan los metadatos del modelo (tablas y columnas)
        context.configure(
            connection=connection, target_metadata=target_metadata
        )
        #Inicia una transacción.
        with context.begin_transaction():
            #Ejecuta las migraciones en la base de datos en el contexto online, 
            #aplicando los cambios directamente.
            context.run_migrations()

#Verifica si se debe ejecutar en modo offline o online. 
#Dependiendo de la situación, se llama a la función 
#correspondiente para ejecutar las migraciones.
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
