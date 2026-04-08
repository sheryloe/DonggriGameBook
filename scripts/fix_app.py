with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace("import { useState, useEffect } from 'react';\n", "")

with open("src/App.tsx", "w") as f:
    f.write(content)
