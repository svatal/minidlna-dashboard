import cgi
import shutil
import re
import os

serials = "/mnt/3tb/media/serials"
checkmark = "/mnt/3tb/media/checkmark.jpg"

form = cgi.FieldStorage()
if not "path" in form:
    print("path not specified.")
else:
    path = os.path.join(serials, form.getfirst("path"))
    if not os.path.isfile(path) or not os.path.normpath(path).startswith(serials):
        print(path)
        print(os.path.isfile(path))
        print(os.path.normpath(path).startswith(serials))
        print("wrong path.")
    else:
        thumb = os.path.splitext(path)[0] + ".jpg"
        shutil.copy(checkmark, thumb)
        print("ok")
