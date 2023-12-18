import pyodbc
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor
import matplotlib.pyplot as plt

server = '192.168.16.3'
database = 'isrproject_test'
username = 'Ayala'
password = 'isr1953'

cnxn = pyodbc.connect('DRIVER={SQL Server};SERVER='+server+';DATABASE='+database+';UID='+username+';PWD='+ password)
cursor = cnxn.cursor()

query = "exec dbo.GetElectricPointChargeDetails '20231001','20231215';"
df = pd.read_sql(query, cnxn)
df1 = df.query('idtag == "14:1F:BA:10:C6:5F"')

# Prepare the data
X = df1[['soc']]
y = df1['diffInSec']

# Split the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Create and fit a Gradient Boosting Regressor model
model = GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, max_depth=3, random_state=42)
model.fit(X_train, y_train)

# Make predictions on the test set
y_pred = model.predict(X_test)

# Calculate the R² score
r2_score = model.score(X_test, y_test)

# Print the R² score
print(f'R² Score: {r2_score}')

# Plot the actual vs predicted values
plt.scatter(X_test, y_test, label='Actual Data')
plt.scatter(X_test, y_pred, color='red', label='Predicted Data')
plt.xlabel('State of Charge (SOC)')
plt.ylabel('Difference in Seconds')
plt.title('Gradient Boosting Regressor: SOC vs. Difference in Seconds')
plt.legend()
plt.show()
