import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getAssets, getRentals } from "../firebase/firestore";
import { Rental, Asset } from "../types";
import { format, isAfter, isBefore, subDays } from "date-fns";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { Clipboard, TrendingUp, BanknoteIcon, AlertCircle } from "lucide-react";
import Badge from "../components/ui/Badge";
import toast from "react-hot-toast";

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Record<string, Asset>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        try {
          const fetchedRentals = await getRentals(currentUser.uid);
          setRentals(fetchedRentals);

          const fetchedAssets = await getAssets(currentUser.uid);
          const assetMap: Record<string, Asset> = {};
          fetchedAssets.forEach((asset) => {
            assetMap[asset.id] = asset;
          });
          setAssets(assetMap);
        } catch (error) {
          console.error("Error fetching data:", error);
          toast.error("Failed to fetch rentals.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [currentUser]);

  const pendingPayments = rentals.filter((rental) => {
    const now = new Date();
    const next7Days = subDays(rental.nextPaymentDate, 7);
    return (
      rental.status === "active" &&
      isAfter(now, next7Days) &&
      isBefore(now, rental.nextPaymentDate)
    );
  });

  const calculateTotalRevenue = () => {
    return rentals.reduce((total, rental) => {
      const paymentTotal = Object.values(rental.payments ?? {}).reduce(
        (sum, payment) => {
          if (
            payment &&
            payment.status === "paid" &&
            typeof payment.amount === "number"
          ) {
            return sum + payment.amount;
          }
          return sum;
        },
        0
      );
      return total + paymentTotal;
    }, 0);
  };

  const calculateTotalExpenses = () => {
    return rentals.reduce((total, rental) => {
      const expenseTotal = Object.values(rental.expenses ?? {}).reduce(
        (sum, expense) => {
          if (expense && typeof expense.amount === "number") {
            return sum + expense.amount;
          }
          return sum;
        },
        0
      );
      return total + expenseTotal;
    }, 0);
  };

  const rentalsWithOverduePayments = rentals.filter((rental) => {
    return (
      isBefore(rental.nextPaymentDate, new Date()) && rental.status === "active"
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const totalRevenue = calculateTotalRevenue();
  const totalExpenses = calculateTotalExpenses();
  const netIncome = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {currentUser?.displayName}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardBody>
            <div className="flex flex-col items-start justify-between h-full">
              <p className="text-blue-100">Total Rentals</p>
              <h3 className="text-2xl font-bold mt-1 break-all">
                {rentals.length
                  .toLocaleString()
                  .replace(/(\d{3})(?=\d)/g, "$1\n")}
              </h3>
              <div className="hidden sm:block mt-2 self-end">
                <div className="p-3 bg-blue-600 rounded-full">
                  <Clipboard className="h-6 w-6" />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardBody>
            <div className="flex flex-col items-start justify-between h-full">
              <p className="text-green-100">Total Revenue</p>
              <h3 className="text-2xl font-bold mt-1 break-all">
                ₹{totalRevenue.toLocaleString().replace(/,/g, ",\u200B")}
              </h3>
              <div className="hidden sm:block mt-2 self-end">
                <div className="p-3 bg-green-600 rounded-full">
                  <BanknoteIcon className="h-6 w-6" />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardBody>
            <div className="flex flex-col items-start justify-between h-full">
              <p className="text-red-100">Total Expenses</p>
              <h3 className="text-2xl font-bold mt-1 break-all">
                ₹{totalExpenses.toLocaleString().replace(/,/g, ",\u200B")}
              </h3>
              <div className="hidden sm:block mt-2 self-end">
                <div className="p-3 bg-red-600 rounded-full">
                  <AlertCircle className="h-6 w-6" />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardBody>
            <div className="flex flex-col items-start justify-between h-full">
              <p className="text-purple-100">Net Income</p>
              <h3 className="text-2xl font-bold mt-1 break-all">
                ₹{netIncome.toLocaleString().replace(/,/g, ",\u200B")}
              </h3>
              <div className="hidden sm:block mt-2 self-end">
                <div className="p-3 bg-purple-600 rounded-full">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Pending payments as cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Upcoming Payments
            </h2>
          </CardHeader>
          <CardBody className="p-0">
            {pendingPayments.length > 0 ? (
              <div className="flex flex-col gap-4 p-2 sm:p-4">
                {pendingPayments.map((rental) => (
                  <div
                    key={rental.id}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-blue-50 border border-blue-100 rounded-lg shadow-sm p-3 sm:p-4 hover:shadow transition"
                  >
                    <div className="flex flex-row items-center gap-3 w-full sm:w-auto">
                      <Badge
                        color={rental.badgeColor}
                        character={rental.badgeCharacter}
                        size="sm"
                        className="mr-2"
                      />
                      <div>
                        <div className="font-semibold text-blue-900">
                          {assets[rental.assetId]?.name || "Unknown"}
                        </div>
                        <div className="text-xs text-blue-500">
                          Next:{" "}
                          <span
                            className={
                              isBefore(rental.nextPaymentDate, new Date())
                                ? "text-red-600 font-medium"
                                : ""
                            }
                          >
                            {format(rental.nextPaymentDate, "MMM dd, yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-3 sm:mt-0 w-full sm:w-auto">
                      <span className="text-lg font-bold text-blue-700">
                        ₹{rental.rate.toLocaleString()}
                      </span>
                      <Link
                        to={`/rentals/${rental.id}/details`}
                        className="inline-flex items-center px-3 py-1 border border-blue-500 text-blue-600 rounded hover:bg-blue-50 text-xs font-medium ml-0 sm:ml-4 w-full sm:w-auto justify-center"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 px-4 text-center text-gray-500">
                <p>No upcoming payments in the next 7 days</p>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Overdue Payments
            </h2>
          </CardHeader>
          <CardBody className="p-0">
            {rentalsWithOverduePayments.length > 0 ? (
              <div className="flex flex-col gap-4 p-2 sm:p-4">
                {rentalsWithOverduePayments.map((rental) => {
                  const today = new Date();
                  const dueDate = new Date(rental.nextPaymentDate);
                  const diffTime = Math.abs(
                    today.getTime() - dueDate.getTime()
                  );
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return (
                    <div
                      key={rental.id}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-red-50 border border-red-100 rounded-lg shadow-sm p-3 sm:p-4 hover:shadow transition"
                    >
                      <div className="flex flex-row items-center gap-3 w-full sm:w-auto">
                        <Badge
                          color={rental.badgeColor}
                          character={rental.badgeCharacter}
                          size="sm"
                          className="mr-2"
                        />
                        <div>
                          <div className="font-semibold text-red-900">
                            {assets[rental.assetId]?.name || "Unknown"}
                          </div>
                          <div className="text-xs text-red-500">
                            Due:{" "}
                            <span className="text-red-600 font-medium">
                              {format(rental.nextPaymentDate, "MMM dd, yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-3 sm:mt-0 w-full sm:w-auto">
                        <span className="text-sm font-bold text-red-600">
                          {diffDays} days overdue
                        </span>
                        <Link
                          to={`/rentals/${rental.id}/details`}
                          className="inline-flex items-center px-3 py-1 border border-red-500 text-red-600 rounded hover:bg-red-50 text-xs font-medium ml-0 sm:ml-4 w-full sm:w-auto justify-center"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 px-4 text-center text-gray-500">
                <p>No overdue payments</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
