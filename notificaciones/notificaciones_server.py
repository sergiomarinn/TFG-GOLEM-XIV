import socketio
from aiohttp import web


sio = socketio.AsyncServer(async_mode='aiohttp', cors_allowed_origins='http://localhost:3000')
app = web.Application()
sio.attach(app)


@sio.event
async def connect(sid, environ):
    print(f"Cliente conectado: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Cliente desconectado: {sid}")

async def emit_practice_corrected_notification(data):
   
    print(f"Práctica enviada desde el servidor notificaciones: ", data)
    await sio.emit('practice_corrected', data)
    


async def handle_notify(request):
    try:
        data = await request.json()
        
        await emit_practice_corrected_notification(data)
        return web.Response(status=200)
    except Exception as e:
        print(f"Error al manejar la notificación: {e}")
        return web.Response(status=500)
    

app.router.add_post('/notify', handle_notify)


if __name__ == '__main__':
    web.run_app(app, port=5000)
