import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getUnmigratedRentals,
  migrateRentalToSubcollections,
} from "../firebase/firestore";
import { Rental } from "../types";

const MigrationPopup: React.FC = () => {
  const { currentUser } = useAuth();
  const [unmigratedRentals, setUnmigratedRentals] = useState<Rental[]>([]);
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (!currentUser) {
        setChecking(false);
        return;
      }
      try {
        const unmigrated = await getUnmigratedRentals(currentUser.uid);
        setUnmigratedRentals(unmigrated);
        setTotal(unmigrated.length);
      } catch (e) {
        console.error("Error checking migration status:", e);
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [currentUser]);

  const runMigration = async () => {
    setMigrating(true);
    setError(null);
    let completed = 0;
    for (const rental of unmigratedRentals) {
      try {
        await migrateRentalToSubcollections(rental);
        completed++;
        setProgress(completed);
      } catch (e) {
        console.error("Migration error:", e);
        setError(
          `Failed to migrate rental ${rental.id}. Please try again.`
        );
        setMigrating(false);
        return;
      }
    }
    setUnmigratedRentals([]);
    setMigrating(false);
  };

  if (checking || unmigratedRentals.length === 0 || !currentUser) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black bg-opacity-60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Data Update Required
        </h2>
        <p className="text-gray-600 mb-4">
          {total} rental(s) need to be updated to the new format. This is a
          one-time process and should only take a moment.
        </p>

        {migrating && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(progress / total) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Migrating {progress} of {total} rentals...
            </p>
          </div>
        )}

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button
          onClick={runMigration}
          disabled={migrating}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {migrating ? "Migrating..." : "Start Update"}
        </button>
      </div>
    </div>,
    document.body
  );
};

export default MigrationPopup;
