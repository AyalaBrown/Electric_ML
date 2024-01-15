# https://www.youtube.com/watch?v=PhJgktRB1AM
import numpy as np
import matplotlib.pyplot as plt
from ypstruct import structure
import fit
import fitness
import ga
import convertions

# problem definition
problem = structure()
problem.costfunc = fitness.fitness
problem.nvar = 5
problem.varmin = -10
problem.varmax = 10

# GA parameters
params = structure()
params.maxit = 500
params.npop = len(convertions.initial_population())
params.beta = 1
params.pc = 1
params.gamma = 0.1
params.mu = 0.1
params.sigma = 0.1

# Run GA
out = ga.run(problem, params)

print(out)

# Results
plt.plot(out.bestcost)
plt.xlim(0, params.maxit)
plt.xlabel('Iteration')
plt.ylabel('Best Cost')
plt.title('Genetic Algorithm (GA)')
plt.grid(True)
plt.show()
