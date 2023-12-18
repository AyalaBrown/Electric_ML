import pyodbc
import pandas as pd
import matplotlib.pyplot as plt

server = '192.168.16.3'
database = 'isrproject_test'
username = 'Ayala'
password = 'isr1953'

cnxn = pyodbc.connect('DRIVER={SQL Server};SERVER='+server+';DATABASE='+database+';UID='+username+';PWD='+ password)
cursor = cnxn.cursor()

query = "exec dbo.GetElectricPointChargeDetails '20231001','20231215';"
df = pd.read_sql(query, cnxn)
bus = "14:1F:BA:10:C6:5F"

df1 = df.query(f'idtag == "{bus}"')

# Group by 'soc' and calculate the mean of 'diffInSec'
average_diff_in_sec = df1.groupby('soc')['diffInSec'].mean().reset_index()

# Plot the results
plt.plot(average_diff_in_sec['soc'], average_diff_in_sec['diffInSec'], marker='o', linestyle='-')
plt.xlabel('State of Charge (SOC)')
plt.ylabel('time in Seconds')
plt.title(f'Bus {bus}')
plt.show()

