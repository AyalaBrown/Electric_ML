# https://www.youtube.com/watch?v=PhJgktRB1AM
import matplotlib.pyplot as plt
from ypstruct import structure
import fit
import ga
import convertions
import readingFromDb

# problem definition
problem = structure()
problem.costfunc = fit.fitness

# GA parameters
params = structure()
params.maxit = 2000                                                                                                                                                                                  
params.npop = len(convertions.initial_population())
params.beta = 1
params.pc = 1

# Run GA
out = ga.run(problem, params)
readingFromDb.write_data(out.bestsol.position, '20240107')
print(out)

# Results
plt.plot(out.bestcost)
plt.xlim(0, params.maxit)
plt.xlabel('Iteration')
plt.ylabel('Best Cost')
plt.title('Genetic Algorithm (GA)')
plt.grid(True)
plt.show()
