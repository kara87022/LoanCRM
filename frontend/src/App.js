import React from 'react';
import { TranslationProvider } from './contexts/TranslationContext';
import { BrowserRouter as Router, Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import UserHeader from './components/UserHeader';
import EmployeeProfile from './components/EmployeeProfile';
import NotificationPanel from './components/NotificationPanel';
import ChatPanel from './components/ChatPanel';
import { authService } from './services/auth';
import Dashboard from './pages/Dashboard';
import Loans from './pages/Loans';
import ClosedLoans from './pages/ClosedLoans';
import Collections from './pages/Collections';
import CollectionMain from './pages/Collections/CollectionMain';
import AllCases from './pages/AllCases';
import Report from './pages/Report';
import Settings from './pages/Settings';
import OverdueCases from './pages/OverdueCases';
import ForeclosedLoans from './pages/ForeclosedLoans';
import ExportData from './pages/ExportData';
import SearchLoan from './pages/SearchLoan';
import LoanDetails from './pages/LoanDetails';
import UserManagement from './pages/UserManagement';
import Notifications from './pages/Notifications';
import UpdateLoan from './pages/UpdateLoan';
import RepaymentTracking from './pages/RepaymentTracking';
import CollectionDashboard from './pages/CollectionDashboard';
import DisbursedCases from './pages/DisbursedCases';
import NOCPage from './pages/NOC';
import ClientManagement from './pages/ClientManagement';
import Login from './pages/Login';

// Administrator imports
import BranchManagement from './pages/Administrator/BranchManagement/BranchManagement';
import BusinessLoan from './pages/Administrator/ProductManagement/BusinessLoan';
import EducationLoan from './pages/Administrator/ProductManagement/EducationLoan';
import GoldLoan from './pages/Administrator/ProductManagement/GoldLoan';
import HomeLoan from './pages/Administrator/ProductManagement/HomeLoan';
import PersonalLoan from './pages/Administrator/ProductManagement/PersonalLoan';
import VehicleLoan from './pages/Administrator/ProductManagement/VehicleLoan';
import EmailTemplates from './pages/Administrator/Settings/EmailTemplates';
import KycDocumentTypes from './pages/Administrator/Settings/KycDocumentTypes';
import NotificationPreferences from './pages/Administrator/Settings/NotificationPreferences';
import SmsTemplates from './pages/Administrator/Settings/SmsTemplates';
import AssignPermissions from './pages/Administrator/UserManagement/AssignPermissions';
import CreateEmployee from './pages/Administrator/UserManagement/CreateEmployee';
import ManageRoles from './pages/Administrator/UserManagement/ManageRoles';

// Authentication imports
import CustomerLogin from './pages/Authentication/Login/CustomerLogin';
import EmployeeLogin from './pages/Authentication/Login/EmployeeLogin';
import RoleBasedAccess from './pages/Authentication/RoleManagement/RoleBasedAccess';

// Dashboard imports
import AdminDashboard from './pages/Dashboard/AdminDashboard/AdminDashboard';
import CustomerDashboard from './pages/Dashboard/CustomerDashboard/CustomerDashboard';
import EmployeeDashboard from './pages/Dashboard/EmployeeDashboard/EmployeeDashboard';
import ManagerDashboard from './pages/Dashboard/ManagerDashboard/ManagerDashboard';

// Customer Support imports
import ClientManagementPage from './pages/CustomerSupport/ClientManagement/ClientManagement';
import ClientProfile from './pages/CustomerSupport/ClientProfile/ClientProfile';

// Leads imports
import NewLead from './pages/Leads/NewLead';
import LeadAssignment from './pages/Leads/LeadAssignment';
import Open from './pages/Leads/LeadStatus/Open';
import InProcess from './pages/Leads/LeadStatus/InProcess';
import Converted from './pages/Leads/LeadStatus/Converted';

// Reports imports
import Reports from './pages/Reports/ReportPages/Reports';

// New component imports
import ApplicationList from './pages/LoanApplication/ApplicationList';
import NewApplication from './pages/LoanApplication/NewApplication';
import KycDocuments from './pages/LoanApplication/KycDocuments';
import CreditScoreCheck from './pages/CreditScoreCheck';
import RiskAssessment from './pages/RiskAssessment';
import ApprovalWorkflow from './pages/ApprovalWorkflow';
import DocumentVerification from './pages/Operations/DocumentVerification';
import DisbursementEntry from './pages/Disbursement/DisbursementEntry';
import FieldVerification from './pages/FieldVerification';
import ApprovedLoans from './pages/ApprovedLoans';
import LegalCases from './pages/LegalCases';
import MyLoans from './pages/MyLoans';
import PayEmi from './pages/PayEmi';
import LeadList from './pages/LeadList';
import VerificationChecklist from './pages/LoanApplication/VerificationChecklist';
import EligibilityCalculation from './pages/LoanApplication/EligibilityCalculation';
import ComplianceChecklist from './pages/ComplianceChecklist';

import './App.css';

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [openSections, setOpenSections] = React.useState({});

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <h1>MINI BUSINESS LOAN</h1>
      <nav>
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Dashboard</Link>
        
        <div className="nav-section">
          <div className="nav-section-header" onClick={() => toggleSection('admin')}>
            <h3>Administrator</h3>
            <span className={`dropdown-arrow ${openSections.admin ? 'open' : ''}`}>▼</span>
          </div>
          {openSections.admin && (
            <div className="nav-dropdown">
              <Link to="/user-management">User Management</Link>
              <Link to="/role-management">Role Management</Link>
              <Link to="/branch-setup">Branch Setup</Link>
              <Link to="/system-settings">System Settings</Link>
            </div>
          )}
        </div>

        <div className="nav-section">
          <div className="nav-section-header" onClick={() => toggleSection('leads')}>
            <h3>Leads</h3>
            <span className={`dropdown-arrow ${openSections.leads ? 'open' : ''}`}>▼</span>
          </div>
          {openSections.leads && (
            <div className="nav-dropdown">
              <Link to="/lead-list">Lead List</Link>
              <Link to="/add-new-lead">Add New Lead</Link>
              <Link to="/assign-lead">Assign to Counsellor</Link>
              <Link to="/lead-followup">Follow-up History</Link>
            </div>
          )}
        </div>

        <div className="nav-section">
          <div className="nav-section-header" onClick={() => toggleSection('applications')}>
            <h3>Loan Applications</h3>
            <span className={`dropdown-arrow ${openSections.applications ? 'open' : ''}`}>▼</span>
          </div>
          {openSections.applications && (
            <div className="nav-dropdown">
              <Link to="/application-list">Application List</Link>
              <Link to="/new-application">New Application</Link>
              <Link to="/kyc-documents">KYC & Documents</Link>
              <Link to="/verification-checklist">Verification Checklist</Link>
              <Link to="/eligibility-calculation">Eligibility Calculation</Link>
            </div>
          )}
        </div>

        <div className="nav-section">
          <div className="nav-section-header" onClick={() => toggleSection('credit')}>
            <h3>Credit Analysis</h3>
            <span className={`dropdown-arrow ${openSections.credit ? 'open' : ''}`}>▼</span>
          </div>
          {openSections.credit && (
            <div className="nav-dropdown">
              <Link to="/credit-score-check">Credit Score Check</Link>
              <Link to="/risk-assessment">Risk Assessment</Link>
              <Link to="/approval-workflow">Approval Workflow</Link>
            </div>
          )}
        </div>

        <div className="nav-section">
          <div className="nav-section-header" onClick={() => toggleSection('operations')}>
            <h3>Operations</h3>
            <span className={`dropdown-arrow ${openSections.operations ? 'open' : ''}`}>▼</span>
          </div>
          {openSections.operations && (
            <div className="nav-dropdown">
              <Link to="/document-verification">Document Verification</Link>
              <Link to="/field-verification">Field Verification</Link>
              <Link to="/compliance-checklist">Compliance Checklist</Link>
            </div>
          )}
        </div>

        <div className="nav-section">
          <div className="nav-section-header" onClick={() => toggleSection('loans')}>
            <h3>Loans</h3>
            <span className={`dropdown-arrow ${openSections.loans ? 'open' : ''}`}>▼</span>
          </div>
          {openSections.loans && (
            <div className="nav-dropdown">
              <Link to="/loans">All Loans</Link>
              <Link to="/loans/closed">Closed Loans</Link>
              <Link to="/loans/noc">NOC</Link>
            </div>
          )}
        </div>

        <div className="nav-section">
          <div className="nav-section-header" onClick={() => toggleSection('disbursement')}>
            <h3>Disbursement</h3>
            <span className={`dropdown-arrow ${openSections.disbursement ? 'open' : ''}`}>▼</span>
          </div>
          {openSections.disbursement && (
            <div className="nav-dropdown">
              <Link to="/approved-loans">Approved Loans</Link>
              <Link to="/disbursement-entry">Disbursement Entry</Link>
              <Link to="/disbursement-reports">Disbursement Reports</Link>
            </div>
          )}
        </div>

        <div className="nav-section">
          <div className="nav-section-header" onClick={() => toggleSection('collection')}>
            <h3>Collection</h3>
            <span className={`dropdown-arrow ${openSections.collection ? 'open' : ''}`}>▼</span>
          </div>
          {openSections.collection && (
            <div className="nav-dropdown">
              <Link to="/collections">Collection Dashboard</Link>
              <Link to="/all-cases">All Cases</Link>
              <Link to="/emi-schedule">EMI Schedule</Link>
              <Link to="/overdue-cases">Overdue Cases</Link>
              <Link to="/collection-entry">Collection Entry</Link>
              <Link to="/escalated-cases">Escalated Cases</Link>
            </div>
          )}
        </div>

        <div className="nav-section">
          <div className="nav-section-header" onClick={() => toggleSection('legal')}>
            <h3>Legal Recovery</h3>
            <span className={`dropdown-arrow ${openSections.legal ? 'open' : ''}`}>▼</span>
          </div>
          {openSections.legal && (
            <div className="nav-dropdown">
              <Link to="/legal-cases">Legal Cases</Link>
              <Link to="/notices-sent">Notices Sent</Link>
              <Link to="/recovery-status">Recovery Status</Link>
            </div>
          )}
        </div>

        <div className="nav-section">
          <div className="nav-section-header" onClick={() => toggleSection('reports')}>
            <h3>Reports</h3>
            <span className={`dropdown-arrow ${openSections.reports ? 'open' : ''}`}>▼</span>
          </div>
          {openSections.reports && (
            <div className="nav-dropdown">
              <Link to="/portfolio-report">Portfolio Report</Link>
              <Link to="/collection-performance">Collection Performance</Link>
              <Link to="/overdue-ageing">Overdue Ageing</Link>
              <Link to="/npa-report">NPA Report</Link>
              <Link to="/profit-loss">Profit & Loss</Link>
            </div>
          )}
        </div>

        <div className="nav-section">
          <div className="nav-section-header" onClick={() => toggleSection('customer')}>
            <h3>Customer Portal</h3>
            <span className={`dropdown-arrow ${openSections.customer ? 'open' : ''}`}>▼</span>
          </div>
          {openSections.customer && (
            <div className="nav-dropdown">
              <Link to="/customer-login">Customer Login</Link>
              <Link to="/my-loans">My Loans</Link>
              <Link to="/pay-emi">Pay EMI</Link>
              <Link to="/service-requests">Service Requests</Link>
            </div>
          )}
        </div>
      </nav>
      
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <span>🚪</span> Logout
        </button>
      </div>
    </div>
  );
}

function AppLayout({ children }) {
  const [showProfile, setShowProfile] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showChat, setShowChat] = React.useState(false);

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <UserHeader 
          onProfileClick={() => setShowProfile(true)}
          onNotificationClick={() => setShowNotifications(!showNotifications)}
          onChatClick={() => setShowChat(!showChat)}
        />
        {children}
      </div>
      
      <EmployeeProfile 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
      />
      
      <NotificationPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
      
      <ChatPanel 
        isOpen={showChat} 
        onClose={() => setShowChat(false)} 
      />
    </div>
  );
}

function App() {
  return (
    <TranslationProvider>
      <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
        
        {/* Administrator Routes */}
        <Route path="/branch-management" element={<ProtectedRoute><AppLayout><BranchManagement /></AppLayout></ProtectedRoute>} />
        <Route path="/business-loan" element={<ProtectedRoute><AppLayout><BusinessLoan /></AppLayout></ProtectedRoute>} />
        <Route path="/education-loan" element={<ProtectedRoute><AppLayout><EducationLoan /></AppLayout></ProtectedRoute>} />
        <Route path="/gold-loan" element={<ProtectedRoute><AppLayout><GoldLoan /></AppLayout></ProtectedRoute>} />
        <Route path="/home-loan" element={<ProtectedRoute><AppLayout><HomeLoan /></AppLayout></ProtectedRoute>} />
        <Route path="/personal-loan" element={<ProtectedRoute><AppLayout><PersonalLoan /></AppLayout></ProtectedRoute>} />
        <Route path="/vehicle-loan" element={<ProtectedRoute><AppLayout><VehicleLoan /></AppLayout></ProtectedRoute>} />
        <Route path="/email-templates" element={<ProtectedRoute><AppLayout><EmailTemplates /></AppLayout></ProtectedRoute>} />
        <Route path="/kyc-document-types" element={<ProtectedRoute><AppLayout><KycDocumentTypes /></AppLayout></ProtectedRoute>} />
        <Route path="/notification-preferences" element={<ProtectedRoute><AppLayout><NotificationPreferences /></AppLayout></ProtectedRoute>} />
        <Route path="/sms-templates" element={<ProtectedRoute><AppLayout><SmsTemplates /></AppLayout></ProtectedRoute>} />
        <Route path="/assign-permissions" element={<ProtectedRoute><AppLayout><AssignPermissions /></AppLayout></ProtectedRoute>} />
        <Route path="/create-employee" element={<ProtectedRoute><AppLayout><CreateEmployee /></AppLayout></ProtectedRoute>} />
        <Route path="/manage-roles" element={<ProtectedRoute><AppLayout><ManageRoles /></AppLayout></ProtectedRoute>} />
        
        {/* Authentication Routes */}
        <Route path="/customer-login" element={<ProtectedRoute><AppLayout><CustomerLogin /></AppLayout></ProtectedRoute>} />
        <Route path="/employee-login" element={<ProtectedRoute><AppLayout><EmployeeLogin /></AppLayout></ProtectedRoute>} />
        <Route path="/role-based-access" element={<ProtectedRoute><AppLayout><RoleBasedAccess /></AppLayout></ProtectedRoute>} />
        
        {/* Dashboard Routes */}
        <Route path="/admin-dashboard" element={<ProtectedRoute><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/customer-dashboard" element={<ProtectedRoute><AppLayout><CustomerDashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/employee-dashboard" element={<ProtectedRoute><AppLayout><EmployeeDashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/manager-dashboard" element={<ProtectedRoute><AppLayout><ManagerDashboard /></AppLayout></ProtectedRoute>} />
        
        {/* Operations Routes */}
        <Route path="/loans" element={<ProtectedRoute><AppLayout><Loans /></AppLayout></ProtectedRoute>} />
        <Route path="/loans/closed" element={<ProtectedRoute><AppLayout><ClosedLoans /></AppLayout></ProtectedRoute>} />
        <Route path="/loans/noc" element={<ProtectedRoute><AppLayout><NOCPage /></AppLayout></ProtectedRoute>} />
        <Route path="/loans/:id/details" element={<ProtectedRoute><AppLayout><LoanDetails /></AppLayout></ProtectedRoute>} />
        
        {/* Administrator Routes */}
        <Route path="/user-management" element={<ProtectedRoute><AppLayout><div>User Management - Coming Soon</div></AppLayout></ProtectedRoute>} />
        <Route path="/role-management" element={<ProtectedRoute><AppLayout><div>Role Management - Coming Soon</div></AppLayout></ProtectedRoute>} />
        <Route path="/branch-setup" element={<ProtectedRoute><AppLayout><div>Branch Setup - Coming Soon</div></AppLayout></ProtectedRoute>} />
        <Route path="/system-settings" element={<ProtectedRoute><AppLayout><div>System Settings - Coming Soon</div></AppLayout></ProtectedRoute>} />
        
        {/* Leads Routes */}
        <Route path="/lead-list" element={<ProtectedRoute><AppLayout><LeadList /></AppLayout></ProtectedRoute>} />
        <Route path="/add-new-lead" element={<ProtectedRoute><AppLayout><div>Add New Lead - Coming Soon</div></AppLayout></ProtectedRoute>} />
        <Route path="/assign-lead" element={<ProtectedRoute><AppLayout><div>Assign Lead - Coming Soon</div></AppLayout></ProtectedRoute>} />
        <Route path="/lead-followup" element={<ProtectedRoute><AppLayout><div>Lead Follow-up - Coming Soon</div></AppLayout></ProtectedRoute>} />
        
        {/* Loan Applications Routes */}
        <Route path="/application-list" element={<ProtectedRoute><AppLayout><ApplicationList /></AppLayout></ProtectedRoute>} />
        <Route path="/new-application" element={<ProtectedRoute><AppLayout><NewApplication /></AppLayout></ProtectedRoute>} />
        <Route path="/kyc-documents" element={<ProtectedRoute><AppLayout><KycDocuments /></AppLayout></ProtectedRoute>} />
        <Route path="/verification-checklist" element={<ProtectedRoute><AppLayout><VerificationChecklist /></AppLayout></ProtectedRoute>} />
        <Route path="/eligibility-calculation" element={<ProtectedRoute><AppLayout><EligibilityCalculation /></AppLayout></ProtectedRoute>} />
        
        {/* Credit Analysis Routes */}
        <Route path="/credit-score-check" element={<ProtectedRoute><AppLayout><CreditScoreCheck /></AppLayout></ProtectedRoute>} />
        <Route path="/risk-assessment" element={<ProtectedRoute><AppLayout><RiskAssessment /></AppLayout></ProtectedRoute>} />
        <Route path="/approval-workflow" element={<ProtectedRoute><AppLayout><ApprovalWorkflow /></AppLayout></ProtectedRoute>} />
        
        {/* Operations Routes */}
        <Route path="/document-verification" element={<ProtectedRoute><AppLayout><DocumentVerification /></AppLayout></ProtectedRoute>} />
        <Route path="/field-verification" element={<ProtectedRoute><AppLayout><FieldVerification /></AppLayout></ProtectedRoute>} />
        <Route path="/compliance-checklist" element={<ProtectedRoute><AppLayout><ComplianceChecklist /></AppLayout></ProtectedRoute>} />
        
        {/* Disbursement Routes */}
        <Route path="/approved-loans" element={<ProtectedRoute><AppLayout><ApprovedLoans /></AppLayout></ProtectedRoute>} />
        <Route path="/disbursement-entry" element={<ProtectedRoute><AppLayout><DisbursementEntry /></AppLayout></ProtectedRoute>} />
        <Route path="/disbursement-reports" element={<ProtectedRoute><AppLayout><div>Disbursement Reports - Coming Soon</div></AppLayout></ProtectedRoute>} />
        
        {/* Collection Routes */}
        <Route path="/emi-schedule" element={<ProtectedRoute><AppLayout><div>EMI Schedule - Coming Soon</div></AppLayout></ProtectedRoute>} />
        <Route path="/collection-entry" element={<ProtectedRoute><AppLayout><div>Collection Entry - Coming Soon</div></AppLayout></ProtectedRoute>} />
        <Route path="/escalated-cases" element={<ProtectedRoute><AppLayout><div>Escalated Cases - Coming Soon</div></AppLayout></ProtectedRoute>} />
        
        {/* Legal Recovery Routes */}
        <Route path="/legal-cases" element={<ProtectedRoute><AppLayout><LegalCases /></AppLayout></ProtectedRoute>} />
        <Route path="/notices-sent" element={<ProtectedRoute><AppLayout><div>Notices Sent - Coming Soon</div></AppLayout></ProtectedRoute>} />
        <Route path="/recovery-status" element={<ProtectedRoute><AppLayout><div>Recovery Status - Coming Soon</div></AppLayout></ProtectedRoute>} />
        
        {/* Reports Routes */}
        <Route path="/portfolio-report" element={<ProtectedRoute><AppLayout><div>Portfolio Report - Coming Soon</div></AppLayout></ProtectedRoute>} />
        <Route path="/collection-performance" element={<ProtectedRoute><AppLayout><div>Collection Performance - Coming Soon</div></AppLayout></ProtectedRoute>} />
        <Route path="/overdue-ageing" element={<ProtectedRoute><AppLayout><div>Overdue Ageing - Coming Soon</div></AppLayout></ProtectedRoute>} />
        <Route path="/npa-report" element={<ProtectedRoute><AppLayout><div>NPA Report - Coming Soon</div></AppLayout></ProtectedRoute>} />
        <Route path="/profit-loss" element={<ProtectedRoute><AppLayout><div>Profit & Loss - Coming Soon</div></AppLayout></ProtectedRoute>} />
        
        {/* Customer Portal Routes */}
        <Route path="/my-loans" element={<ProtectedRoute><AppLayout><MyLoans /></AppLayout></ProtectedRoute>} />
        <Route path="/pay-emi" element={<ProtectedRoute><AppLayout><PayEmi /></AppLayout></ProtectedRoute>} />
        <Route path="/service-requests" element={<ProtectedRoute><AppLayout><div>Service Requests - Coming Soon</div></AppLayout></ProtectedRoute>} />
        <Route path="/collections" element={<ProtectedRoute><AppLayout><CollectionMain /></AppLayout></ProtectedRoute>} />
        <Route path="/all-cases" element={<ProtectedRoute><AppLayout><AllCases /></AppLayout></ProtectedRoute>} />
        <Route path="/disbursed-cases" element={<ProtectedRoute><AppLayout><DisbursedCases /></AppLayout></ProtectedRoute>} />
        <Route path="/loan-application" element={<ProtectedRoute><AppLayout><div>Loan Application - Coming Soon</div></AppLayout></ProtectedRoute>} />
        <Route path="/document-management" element={<ProtectedRoute><AppLayout><div>Document Management - Coming Soon</div></AppLayout></ProtectedRoute>} />
        
        {/* Customer Support Routes */}
        <Route path="/client-management" element={<ProtectedRoute><AppLayout><ClientManagementPage /></AppLayout></ProtectedRoute>} />
        <Route path="/client-profile" element={<ProtectedRoute><AppLayout><ClientProfile /></AppLayout></ProtectedRoute>} />
        
        {/* Leads Routes */}
        <Route path="/new-lead" element={<ProtectedRoute><AppLayout><NewLead /></AppLayout></ProtectedRoute>} />
        <Route path="/lead-assignment" element={<ProtectedRoute><AppLayout><LeadAssignment /></AppLayout></ProtectedRoute>} />
        <Route path="/open-leads" element={<ProtectedRoute><AppLayout><Open /></AppLayout></ProtectedRoute>} />
        <Route path="/in-process-leads" element={<ProtectedRoute><AppLayout><InProcess /></AppLayout></ProtectedRoute>} />
        <Route path="/converted-leads" element={<ProtectedRoute><AppLayout><Converted /></AppLayout></ProtectedRoute>} />
        
        {/* Reports Routes */}
        <Route path="/reports" element={<ProtectedRoute><AppLayout><Reports /></AppLayout></ProtectedRoute>} />
        <Route path="/audit-compliance" element={<ProtectedRoute><AppLayout><div>Audit Compliance - Coming Soon</div></AppLayout></ProtectedRoute>} />
        <Route path="/export-data" element={<ProtectedRoute requiredRole="admin"><AppLayout><ExportData /></AppLayout></ProtectedRoute>} />
        
        {/* System Routes */}
        <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
        <Route path="/user-management" element={<ProtectedRoute requiredRole="admin"><AppLayout><UserManagement /></AppLayout></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><AppLayout><Notifications /></AppLayout></ProtectedRoute>} />
        <Route path="/search-loan" element={<ProtectedRoute><AppLayout><SearchLoan /></AppLayout></ProtectedRoute>} />
        <Route path="/overdue-cases" element={<ProtectedRoute><AppLayout><OverdueCases /></AppLayout></ProtectedRoute>} />
        <Route path="/foreclosed-loans" element={<ProtectedRoute><AppLayout><ForeclosedLoans /></AppLayout></ProtectedRoute>} />
        <Route path="/update-loan" element={<ProtectedRoute><AppLayout><UpdateLoan /></AppLayout></ProtectedRoute>} />
        <Route path="/repayment-tracking" element={<ProtectedRoute><AppLayout><RepaymentTracking /></AppLayout></ProtectedRoute>} />
        <Route path="/collection-dashboard" element={<ProtectedRoute requiredRole="admin"><AppLayout><CollectionDashboard /></AppLayout></ProtectedRoute>} />
      </Routes>
    </Router>
    </TranslationProvider>
  );
}

export default App;
