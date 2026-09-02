import { createBrowserRouter, redirect } from 'react-router';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { MyDashboard } from './pages/MyDashboard';
import { ExecLayout } from './pages/executive/ExecLayout';
import { ExecPosture } from './pages/executive/ExecPosture';
import { AppetiteMonitor } from './pages/executive/AppetiteMonitor';
import { KRIDashboard } from './pages/executive/KRIDashboard';
import { BoardReport } from './pages/executive/BoardReport';
import { VendorList } from './pages/VendorList';
import { VendorDetail } from './pages/VendorDetail';
import { ContractList } from './pages/ContractList';
import { ContractDetail } from './pages/ContractDetail';
import { TPRMDashboard } from './pages/TPRMDashboard';
import { ProcessDashboard } from './pages/ProcessDashboard';
import { ProcessDetail } from './pages/ProcessDetail';
import { ProductDashboard } from './pages/ProductDashboard';
import { ProductDetail } from './pages/ProductDetail';
import { RiskDashboard } from './pages/RiskDashboard';
import { RiskDetail } from './pages/RiskDetail';
import { ControlRegister } from './pages/ControlRegistry';
import { ControlDetail } from './pages/ControlDetail';
import { ComplianceDashboard } from './pages/ComplianceDashboard';
import { FrameworkDetail } from './pages/FrameworkDetail';
import { EnterpriseDashboard } from './pages/EnterpriseDashboard';
import { Configuration } from './pages/Configuration';
import { EmployerList } from './pages/EmployerList';
import { EmployerDetail } from './pages/EmployerDetail';
import { RegulationRegister } from './pages/RegulationRegister';
import { RegulationDetail } from './pages/RegulationDetail';
import { BillTracker } from './pages/BillTracker';
import { BillDetail } from './pages/BillDetail';
import { RegulatoryComplianceDashboard } from './pages/RegulatoryComplianceDashboard';
import { PlanDetail } from './pages/PlanDetail';
import { PersonaList } from './pages/PersonaList';
import { PersonaDetail } from './pages/PersonaDetail';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppShell,
    children: [
      { index: true, Component: Dashboard },
      { path: 'my-dashboard', Component: MyDashboard },
      {
        path: 'executive',
        Component: ExecLayout,
        children: [
          { index: true, loader: () => redirect('/executive/posture') },
          { path: 'posture',  Component: ExecPosture     },
          { path: 'appetite', Component: AppetiteMonitor },
          { path: 'kris',     Component: KRIDashboard    },
          { path: 'report',   Component: BoardReport     },
        ],
      },
      { path: 'vendors', Component: VendorList },
      { path: 'vendors/:id', Component: VendorDetail },
      { path: 'contracts', Component: ContractList },
      { path: 'contracts/:id', Component: ContractDetail },
      { path: 'tprm', Component: TPRMDashboard },
      { path: 'processes', Component: ProcessDashboard },
      { path: 'processes/:id', Component: ProcessDetail },
      { path: 'products', Component: ProductDashboard },
      { path: 'products/:id', Component: ProductDetail },
      { path: 'plans/:id', Component: PlanDetail },
      { path: 'risk-dashboard', Component: RiskDashboard },
      { path: 'risks/:id', Component: RiskDetail },
      { path: 'controls', Component: ControlRegister },
      { path: 'controls/:id', Component: ControlDetail },
      { path: 'compliance', Component: ComplianceDashboard },
      { path: 'compliance/:id', Component: FrameworkDetail },
      { path: 'enterprise-risk-dashboard', Component: EnterpriseDashboard },
      { path: 'configuration', Component: Configuration },
      { path: 'entities', Component: EmployerList },
      { path: 'entities/:id', Component: EmployerDetail },
      { path: 'personas', Component: PersonaList },
      { path: 'personas/:id', Component: PersonaDetail },
      { path: 'regulations', Component: RegulationRegister },
      { path: 'regulations/:id', Component: RegulationDetail },
      { path: 'bills', Component: BillTracker },
      { path: 'bills/:id', Component: BillDetail },
      { path: 'regulatory-compliance-dashboard', Component: RegulatoryComplianceDashboard },
      { path: '*', loader: () => redirect('/') },
    ],
  },
]);