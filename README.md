# markovmutator

# markovmutator
Text generation tools for combining text snippets and online documents and generating bodies of text
    
This project is generated with [yo angular generator](https://github.com/yeoman/generator-angular)
version 0.15.1.

# Dependencies
* Python 3.x
* Flask
* Gutenberg API (requires the latest version, which must be obtained through Github rather than PyPi)
    - For Ubuntu-based systems, first "sudo apt-get install python3-bsddb3" for Berkeley database dependency
    - Clone or download repo: git clone https://github.com/c-w/Gutenberg.git and cd into directory
    - Copy over requirements.pip with requirements-py3.pip (on Linux, cp requirements-py3.pip requirements.pip)
    - To install Gutenberg API, sudo pip3 install .
* NLTK, numpy
    - For Linux users, install NLTK and numpy: "sudo pip3 install nltk; sudo pip3 install numpy"
    - Open the Python console, import nltk, and download the relevant packages:
      - punkt, averaged_perceptron_tagger, 


## Build & development

Run `grunt` for building and `grunt serve` for preview.

## Testing

Running `grunt test` will run the unit tests with karma.
