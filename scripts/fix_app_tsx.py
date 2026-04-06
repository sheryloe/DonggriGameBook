with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace("> {qId.replace(/_/g, ' ').toUpperCase()}", "&gt; {qId.replace(/_/g, ' ').toUpperCase()}")

with open("src/App.tsx", "w") as f:
    f.write(content)
