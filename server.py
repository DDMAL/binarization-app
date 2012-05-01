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

import gamera.core as gam

define("port", default=8888, help="run on the given port", type=int)


class MainHandler(tornado.web.RequestHandler):
    """
    Handles image uploading.
    """
    def get(self):
        self.render("templates/index.html")
        
    def post(self):
        """
        Saves original uploaded file, then file as png.
        """
        try:
            fulln = self.request.files["image"][0]["filename"]
            filen, ext = os.path.splitext(fulln)
            # WHICH EXTENSIONS TO ACCEPT??? HANDLE HERE???
            f = open("static/img/{0}".format(fulln), "w")
            f.write(self.request.files["image"][0]['body'])
            f.close()
            # convert img to greyscale first (requirement of most thresholding functions)
            image = gam.load_image("static/img/{0}".format(fulln))
            image.save_image("static/img/{0}_original{1}".format(filen, ext))
            image = image.to_greyscale()
            image.save_PNG("static/img/{0}.png".format(filen))
            self.redirect("/binarize?filen={0}.png".format(filen))
        except KeyError:
            self.redirect("/")
        
class BinarizationHandler(tornado.web.RequestHandler):
    def is_xhr(self):
        """Return True if AJAX request"""
        return self.request.headers.get("X-requested-with", "").lower() == "xmlhttprequest"
    
    def binarize(self, image, **kwargs):
        logging.info(kwargs)
        selected = kwargs.get("selected")
        if selected == "sauvola":
            logging.info("selected sauvola")
            region_size = kwargs.get("regionSize")[0]
            sensitivity = kwargs.get("sensitivity")[0]
            dynamic_range = kwargs.get("dynamicRange")[0]
            lower_bound, upper_bound = kwargs.get("bounds")
            image = image.sauvola_threshold(region_size, sensitivity, dynamic_range, lower_bound, upper_bound)
            return image
        elif selected == "niblack":
            logging.info("selected niblack")
            region_size = kwargs.get("regionSize")[0]
            sensitivity = kwargs.get("sensitivity")[0]
            lower_bound, upper_bound = kwargs.get("bounds")
            image = image.sauvola_threshold(region_size, sensitivity, lower_bound, upper_bound)
            return image
        else:
            pass
        
    def get(self):
        if not self.is_xhr():
            # not an ajax request - show binarize page
            filen = self.get_argument("filen")
            self.render("templates/binarize.html", filen=filen)
        else:
            # ajax request - get parameters and re-binarize
            data = tornado.escape.json_decode(self.get_argument("data"))
            path = os.path.dirname(data["filen"])
            filen, ext = os.path.splitext(os.path.basename(data["filen"]))
            loadn = "{0}/{1}{2}".format(path, filen, ext)
            newn = "{0}/{1}_{2}{3}".format(path, filen, randint(1, 1000000), ext)        
            # check if file already binarized & saved
            if not os.path.exists(newn):
                image = gam.load_image(loadn)
                binarized = BinarizationHandler.binarize(self, image, **data)
                binarized.save_PNG(newn)
                logging.info("binarized image %s to %s" % (filen, newn))
            self.write(newn)
        
settings = {
    "static_path": os.path.join(os.path.dirname(__file__), "static"),
    "debug": True,
    "cookie_secret": "secretlol",
}
  
def main():
    gam.init_gamera()
    tornado.options.parse_command_line()
    application = tornado.web.Application([
        (r"/", MainHandler),
        (r"/binarize", BinarizationHandler)
    ], **settings)
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()

