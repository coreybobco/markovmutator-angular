from flask import Flask, request, jsonify
import json
from scraper import Scraper
from pprint import pprint

app = Flask(__name__)

@app.route("/addGene", methods=['POST'])
def addGene():
    url = json.loads(request.get_data().decode(encoding='UTF-8'))
    bookScraper = Scraper(url)
    book_info = bookScraper.serialize()
    return jsonify(book_info)

@app.route("/mutate", methods=['POST'])
def mutate():
    gene_ids = json.loads(request.get_data().decode(encoding='UTF-8'))
    print(gene_ids)
    return ""

if __name__ == '__main__':
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
