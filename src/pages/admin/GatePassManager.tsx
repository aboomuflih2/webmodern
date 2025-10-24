import { Helmet } from "react-helmet-async";
import { GatePassDashboard } from "@/components/admin/GatePassDashboard";

const GatePassManager = () => {
  return (
    <>
      <Helmet>
        <title>Gate Pass Management - Admin Dashboard</title>
        <meta name="description" content="Manage gate pass requests and visitor access" />
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gate Pass Management</h1>
          <p className="text-muted-foreground">
            Review and manage gate pass requests from visitors, parents, and other stakeholders.
          </p>
        </div>
        
        <GatePassDashboard />
      </div>
    </>
  );
};

export default GatePassManager;