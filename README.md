Run these commands to initalize and install dependencies
>`npm install --save react-native-windows@^0.76.0`

>`npx react-native init-windows --overwrite`

>`npx react-native run-windows`


Run this everytime you want to build: `npx react-native run-windows`

This is for the codegen error: `$env:SKIP_CODEGEN_WINDOWS = "true"`

For the backend API:  `python -m uvicorn live_match_api:app --reload`

For unit testing the backend: `python -m unittest api_test.py`

For generating a code coverage web report:
> `python -m coverage run api_test.py`

> `python -m coverage report`

> `python -m coverage html`
Then navigate to htmlcov\index.hml
