from flask import Flask,render_template
app = Flask(__name__, template_folder=".",static_folder="./src")

@app.route('/')
def index():
    return render_template('main.html')

if __name__ == '__main__':
    app.debug = True
    app.run()