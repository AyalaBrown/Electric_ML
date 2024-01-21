import random

# Define a list of tuples containing two numbers each
tuples_list = [(1, 2), (3, 4), (5, 6)]

# Generate a dictionary with tuples as keys
my_dict = {}

my_dict[(1, 1)] = {"a": 0}
my_dict[(1, 2)] = {"a": 1}
my_dict[(2, 1)] = {"a": 2}

keys_list = list(my_dict.keys())

random_element = my_dict[random.choice(keys_list)]

# Print the resulting dictionary
print(random_element)