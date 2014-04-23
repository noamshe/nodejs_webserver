
node-gyp configure
node-gyp build


A/B Testing
ab2 -n 100000 -c 10 -p ~/myapps/data.txt -T "text/xml" http://127.0.0.1:8080/

data.txt:
<id>123</id>

