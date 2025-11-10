from flask import Flask, request, jsonify
import sqlite3
import os

app = Flask(__name__)
DATABASE = '/tmp/lab.db'
FLAG = os.environ.get('LAB_FLAG', 'OMNIHACKDEFAULT')


def init_db():
    conn = sqlite3.connect(DATABASE)
    cur = conn.cursor()
    cur.execute('CREATE TABLE IF NOT EXISTS secrets (id INTEGER PRIMARY KEY, flag TEXT)')
    cur.execute('DELETE FROM secrets')
    cur.execute('INSERT INTO secrets(flag) VALUES (?)', (FLAG,))
    conn.commit()
    conn.close()


@app.route('/')
def index():
    return '<h1>Search the catalog</h1>'


@app.route('/search')
def search():
    q = request.args.get('q', '')
    conn = sqlite3.connect(DATABASE)
    cur = conn.cursor()
    try:
        query = f"SELECT flag FROM secrets WHERE flag LIKE '%{q}%'"
        cur.execute(query)
        rows = cur.fetchall()
        if rows:
            return jsonify({'results': rows})
    except sqlite3.Error as exc:
        return f"SQL error: {exc}", 500
    finally:
        conn.close()
    return jsonify({'results': []})


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000)
