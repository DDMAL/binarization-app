#!/usr/bin/python

"""
    Binarization application using Tornado and Gamera
    """

import os
import logging
from random import randint

import tornado.httpserver
import tornado.ioloop
import tornado.web
from tornado.options import define, options

#import gamera.core as gam

define("port", default=8888, help="run on the given port", type=int)


class MainHandler(tornado.web.RequestHandler):
    """
        Handles image uploading.
        """
    def get(self):
        self.render("templates/index.html")

settings = {
    "static_path": os.path.join(os.path.dirname(__file__), "static"),
    "debug": True,
    "cookie_secret": "secretlol",
}

def main():
    #gam.init_gamera()
    tornado.options.parse_command_line()
    application = tornado.web.Application([
                                           (r"/", MainHandler),
                                           ], **settings)
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()

