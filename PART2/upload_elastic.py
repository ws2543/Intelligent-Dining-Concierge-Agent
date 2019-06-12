import time
import csv
import requests
import json

def main():
    with open('PRE.csv', 'r', newline='') as file1:
        reader = csv.reader(file1, delimiter=',', quotechar='|')
        id = 1
        for row in reader:
            data = {'RestaurantID': row[0], 'Cuisine':row[1], 'Score':row[2]}
            url = 'ELASTIC-DOMIAN-URL/YOUR-INDEX/YOUR-TYPE/' + str(id)
            r = requests.put(url, data=json.dumps(data), headers={'content-type': "application/json"})
            print(r.text)
            #time.sleep(1)
            id += 1
main()