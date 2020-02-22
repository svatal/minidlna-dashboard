import os
import json
# import cgitb

# cgitb.enable()

print("Content-Type: application/json")
print("Access-Control-Allow-Origin: *")
print("")

serials = "/mnt/3tb/media/serials"


def main():
    names = os.listdir(serials)
    result = []
    for name in names:
        dirPath = os.path.join(serials, name)
        if not os.path.isfile(dirPath):
            fileStats = getFiles(dirPath)
            result.append({
                "dirname": name,
                # "time": os.path.getmtime(dirPath),
                "files": fileStats
                # "files": {
                #     "total": len(fileStats),
                #     "unseen": sum(not item["seen"] for item in fileStats),
                #     "unseen w subs": sum(not item["seen"] and item["subtitles"] for item in fileStats)
                # }
            })
    result.sort(key=lambda obj: obj["dirname"])
    print(json.dumps(result))


def getFiles(dirPath):
    dic = {}
    for name in os.listdir(dirPath):
        parts = os.path.splitext(name)
        ext = parts[1]
        name = parts[0]
        if not dic.has_key(name):
            dic[name] = {
                "extension": False,
                "subtitles": False,
                "seen": False
            }
        if ext in [".mov", ".mp4", ".avi", ".mkv", ".m4v", ".xvid", ".divx", ".wmv", ".mpg", ".mpeg"]:
            dic[name]["extension"] = ext
        elif ext in [".srt", ".sub"]:
            dic[name]["subtitles"] = True
        elif ext == ".jpg":
            dic[name]["seen"] = True

    result = map(
        eraseExtensionKeyFromDict,
        filter(
            lambda i: i["extension"],
            map(appendFilename, dic.items())
        )
    )
    result.sort(key=lambda obj: obj["filename"])
    return result


def eraseExtensionKeyFromDict(obj):
    obj["filename"] += obj["extension"]
    del obj["extension"]
    return obj


def appendFilename((name, obj)):
    obj["filename"] = name
    return obj


# print(getFiles(os.path.join(serials, "Superstore")))
main()
