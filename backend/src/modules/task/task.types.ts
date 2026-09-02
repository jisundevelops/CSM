export interface CreateTaskInput {
  findingId: string;
  assignedTo?: string;
  status?: string;
}

export interface UpdateTaskInput {
  assignedTo?: string;
  status?: string;
}