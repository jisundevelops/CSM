import express from 'express';
import cors from 'cors';
import auditRoutes from './modules/audit/audit.routes';
import authRoutes from './modules/auth/auth.routes';
import orgRoutes from './modules/organization/organization.routes';
import assetRoutes from './modules/asset/asset.routes';
import findingRoutes from './modules/finding/finding.routes';
import taskRoutes from './modules/task/task.routes';
import verificationRoutes from './modules/verification/verification.routes';
import evidenceRoutes from './modules/evidence/evidence.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/orgs', orgRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/findings', findingRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/audit-logs', auditRoutes);

export default app;