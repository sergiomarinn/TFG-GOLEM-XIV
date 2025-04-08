import os
import json
import time
import random
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MOCK_DELAY_MIN = float(os.getenv("MOCK_DELAY_MIN", 15))
MOCK_DELAY_MAX = float(os.getenv("MOCK_DELAY_MAX", 30))

def load_mock_result(filename):
    with open(os.path.join(BASE_DIR, "mocks", filename), "r") as f:
        return json.load(f)

java_mock = load_mock_result("java_result.json")
python_mock = load_mock_result("python_result.json")

def fake_test_result(name: str, language: str):
    return {
        "status": "success",
        "timestamp": time.time(),
        "name": name,
        "language": language,
        "details": f"Simulación exitosa de ejecución para {language.upper()}"
    }

def handle_java(name: str, original_data: dict) -> dict:
    print(" [JAVA] Procesando práctica:", name)
    time.sleep(random.uniform(MOCK_DELAY_MIN, MOCK_DELAY_MAX))  # Simulando un tiempo de espera para la respuesta
    test_result = fake_test_result(name, "java")
    original_data["info"] = test_result

    # original_data["info"] = java_mock.copy()
    return original_data

def handle_python(name: str, original_data: dict) -> dict:
    print(" [PYTHON] Procesando práctica:", name)
    time.sleep(random.uniform(MOCK_DELAY_MIN, MOCK_DELAY_MAX))  # Simulando un tiempo de espera para la respuesta
    test_result = fake_test_result(name, "python")
    original_data["info"] = test_result

    # original_data["info"] = python_mock.copy()
    return original_data
