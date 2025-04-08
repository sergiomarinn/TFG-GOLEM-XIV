import logging

class ColorFormatter(logging.Formatter):
    # ANSI codes
    COLORS = {
        "DEBUG":    "\033[37m",      # Gris
        "INFO":     "\033[1;32m",    # Verde brillante
        "WARNING":  "\033[1;33m",    # Amarillo brillante
        "ERROR":    "\033[1;31m",    # Rojo brillante
        "CRITICAL": "\033[1;41m",    # Fondo rojo brillante
    }

    def format(self, record):
        reset = "\033[0m"
        bold = "\033[1m"
        blue = "\033[1;34m"

        # Obtener color según el levelname
        color = self.COLORS.get(record.levelname, "")
        padded_levelname = f"{record.levelname:<7}"  # Alineado a la derecha
        record.levelname = f"{bold}{color}{padded_levelname}{reset}"

        # Colorear el filename en azul
        record.filename = f"{blue}{record.filename:<13}{reset}"

        return super().format(record)

def configure_logging():
    # Force reconfiguration of root logger
    root_logger = logging.getLogger()
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Configure handler explicitly
    handler = logging.StreamHandler()
    formatter = ColorFormatter(
        "\033[1m%(asctime)s | %(levelname)s | %(filename)s >> %(message)s",
        datefmt="%d-%m-%Y %H:%M:%S"
    )
    handler.setFormatter(formatter)

    # Apply to root logger
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(handler)

    return root_logger