import numpy as np
import pygad
import fitness_func
import initializations
import fitness_func
import convertions

function_inputs = initializations.getFunctionInputs() # Function inputs.
desired_output = None # Function output.

# def fitness_func(ga_instance, solution, solution_idx):
#     output = np.sum(solution*function_inputs)
#     fitness = 1.0 / np.abs(output - desired_output)
#     # print(fitness)
#     return fitness

num_generations = 50
num_parents_mating = 1

population = convertions.initial_population()

fitness_function = fitness_func.fitness_func

sol_per_pop = len(population)
num_genes = len(population[0])

init_range_low = 0
init_range_high = 5

parent_selection_type = "sss"
keep_parents = 1

crossover_type = "single_point"

mutation_type = "random"
mutation_percent_genes = 5

min_values = [1, 101, 7, 8, 1] 
max_values = [4, 106, 12, 13, 5] 

def custom_mutation(solution, num_genes, min_value, max_value):
    mutated_solution = np.copy(solution)
    mutation_point = np.random.randint(0, num_genes)
    mutated_solution[mutation_point] = np.round(mutated_solution[mutation_point])
    parameter_index = mutation_point%5
    mutated_solution[mutation_point] = np.clip(mutated_solution[mutation_point], min_value[parameter_index], max_value[parameter_index])
    return mutated_solution

def on_gen(ga_instance):
    print("Generation : ", ga_instance.generations_completed)
    print("Fitness of the best solution :", ga_instance.best_solution()[1])

ga_instance = pygad.GA(num_generations=num_generations,
                       on_generation=on_gen,
                       num_parents_mating=num_parents_mating,
                       fitness_func=fitness_function,
                       sol_per_pop=sol_per_pop,
                       num_genes=num_genes,
                       initial_population=population,
                       init_range_low=init_range_low,
                       init_range_high=init_range_high,
                       parent_selection_type=parent_selection_type,
                       keep_parents=keep_parents,
                       crossover_type=crossover_type,
                       mutation_type=lambda solution, num_genes: custom_mutation(solution, num_genes, min_values, max_values),
                       mutation_percent_genes=mutation_percent_genes)

ga_instance.run()

ga_instance.plot_fitness()

solution, solution_fitness, solution_idx = ga_instance.best_solution()
print(f"Parameters of the best solution : {solution}")
print(f"Fitness value of the best solution = {solution_fitness}")
print(f"Index of the best solution : {solution_idx}")

if ga_instance.best_solution_generation != -1:
    print(f"Best fitness value reached after {ga_instance.best_solution_generation} generations.")

filename = './genetic'
ga_instance.save(filename=filename)

loaded_ga_instance = pygad.load(filename=filename)

print(loaded_ga_instance.best_solution())