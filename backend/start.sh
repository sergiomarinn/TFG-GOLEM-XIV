#!/bin/bash

uvicorn main:app --reload &

python -m api.worker &

python -m api.notificaciones_server &

python -m api.server &

wait
