import argparse
import logging
import os
import socket
import sys

import twisted.cred.checkers
import twisted.cred.credentials
import twisted.cred.portal
import twisted.internet
import twisted.protocols.ftp
from twisted.python import filepath, log
from zope.interface import implementer


def make_ftp_shell(avatar_id, ftp_directory):
    if avatar_id is twisted.cred.checkers.ANONYMOUS:
        return twisted.protocols.ftp.FTPAnonymousShell(ftp_directory)
    else:
        return twisted.protocols.ftp.FTPShell(ftp_directory)


@implementer(twisted.cred.portal.IRealm)
class FTPRealm(object):

    def __init__(self, ftp_directory):
        self._ftp_directory = filepath.FilePath(ftp_directory)

    def requestAvatar(self, avatarId, mind, *interfaces):
        for iface in interfaces:
            if iface is twisted.protocols.ftp.IFTPShell:
                avatar = make_ftp_shell(avatarId, self._ftp_directory)
                return (twisted.protocols.ftp.IFTPShell,
                        avatar,
                        getattr(avatar, "logout", lambda: None))
        raise NotImplementedError()


class FtpServerFactory(object):
    
    def __init__(self, ftp_directory, host, port, username=None, password=None):
        factory = twisted.protocols.ftp.FTPFactory()
        realm = FTPRealm(ftp_directory)
        portal = twisted.cred.portal.Portal(realm)
        portal.registerChecker(twisted.cred.checkers.AllowAnonymousAccess(),
                               twisted.cred.credentials.IAnonymous)

        if username and password:
            checker = twisted.cred.checkers.InMemoryUsernamePasswordDatabaseDontUse()
            checker.addUser(username, password)
            portal.registerChecker(checker)
            factory.userAnonymous = ""

        factory.tld = ftp_directory
        factory.portal = portal
        factory.protocol = twisted.protocols.ftp.FTP
        self._factory = factory
        self._host = host
        self._port = port

    def makeListener(self):
        # XXX use 0 instea`d of self._port?
        return twisted.internet.reactor.listenTCP(
            self._port, self._factory,
            interface=self._host)


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Specify the arguments for creating the ftp server",
        prog="FTP Server",
        # formatter class which adds `default` params in help
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )

    parser.add_argument("--directory_path",
                        type=str,
                        # required=True,
                        default=os.getcwd(),
                        help="Specify the path of directory hosting as ftp directory")
    parser.add_argument("--host",
                        type=str,
                        default=socket.gethostbyname(socket.getfqdn()),
                        help="Specify the ip to host the ftp server")
    parser.add_argument("--port",
                        type=int,
                        default=2121,
                        help="Specify the port of the ftp server")
    parser.add_argument("--version", "-V", action="version",
                        version="%(prog)s 1.0.0.0")

    # adding subparser for authentication
    subparser = parser.add_subparsers(
        title="Authentication",
        description="Specify username and password to secure the ftp server",
        help="Specify for authentication"
    )
    new_parser = subparser.add_parser("auth", help="auth --help",)
    new_parser.add_argument("--username",
                            type=str,
                            required=True,
                            help="Specify the username to access to be created ftp server")
    new_parser.add_argument("--password",
                            type=str,
                            required=True,
                            help="Specify the password to access to be created ftp server")

    args = parser.parse_args()
    if not os.path.isdir(args.directory_path):
        print(
            f"Specified directory - {args.directory_path} is not a valid directory")
        sys.exit()

    return args


def main():
    args = vars(parse_arguments())

    # if options.log:
    log.startLogging(sys.stdout)

    factory = FtpServerFactory(
        ftp_directory=args.get("directory_path"),
        host=args.get("host"),
        port=args.get("port"),
        username=args.get("username"),
        password=args.get("password"),
    )
    factory.makeListener()
    twisted.internet.reactor.run()


if __name__ == "__main__":

    main()