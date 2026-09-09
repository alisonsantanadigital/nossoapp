import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import type { Organization } from "../types";

interface OrgContextType {
  organization: Organization | null;
  loadingOrg: boolean;
  refreshOrg: () => Promise<void>;
}

const OrgContext = createContext<OrgContextType>({
  organization: null,
  loadingOrg: true,
  refreshOrg: async () => {},
});

export const useOrg = () => useContext(OrgContext);

export const OrgProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { userProfile } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(true);

  const fetchOrg = async (orgId: string) => {
    try {
      const docRef = doc(db, "organizations", orgId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setOrganization({ id: docSnap.id, ...docSnap.data() } as Organization);
      } else {
        setOrganization(null);
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
    } finally {
      setLoadingOrg(false);
    }
  };

  const refreshOrg = async () => {
    if (userProfile?.currentOrganizationId) {
      await fetchOrg(userProfile.currentOrganizationId);
    }
  };

  useEffect(() => {
    if (userProfile?.currentOrganizationId) {
      setLoadingOrg(true);
      fetchOrg(userProfile.currentOrganizationId);
    } else {
      setOrganization(null);
      setLoadingOrg(false);
    }
  }, [userProfile?.currentOrganizationId]);

  return (
    <OrgContext.Provider value={{ organization, loadingOrg, refreshOrg }}>
      {children}
    </OrgContext.Provider>
  );
};
