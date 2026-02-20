import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  CircleDollarSign,
  Receipt,
  ReceiptText,
  CalendarClock,
  PlusCircle,
  Edit,
  Trash2,
  Download,
  Save,
} from "lucide-react";
import { format, isAfter, set } from "date-fns";
import { usePDF } from "react-to-pdf";
import { useForm, Controller } from "react-hook-form";
import { useAuth } from "../../contexts/AuthContext";
import {
  getRentalById,
  getAssetById,
  getContactById,
  addPayment,
  updatePayment,
  deletePayment,
  addExpense,
  updateExpense,
  deleteExpense,
  updateRental,
  addDue,
  updateDue,
  deleteDue,
  getPaymentsPaginated,
  getExpensesPaginated,
  getDuesPaginated,
  getAllPayments,
  getAllExpenses,
  getAllDues,
} from "../../firebase/firestore";
import {
  Asset,
  Contact,
  Rental,
  Payment,
  Expense,
  PaymentStatus,
  Due,
} from "../../types";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import Textarea from "../../components/ui/Textarea";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import { toast } from "react-hot-toast";

type PaymentFormValues = {
  amount: number;
  date: string;
  status: PaymentStatus;
  notes: string;
};

type ExpenseFormValues = {
  amount: number;
  date: string;
  description: string;
};

type DueFormValues = {
  amount: number;
  date: string;
  description: string;
};

const RentalDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rental, setRental] = useState<Rental | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);

  // Subcollection data
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dues, setDues] = useState<Due[]>([]);

  // Pagination state
  const [paymentsLastDoc, setPaymentsLastDoc] = useState<any>(undefined);
  const [expensesLastDoc, setExpensesLastDoc] = useState<any>(undefined);
  const [duesLastDoc, setDuesLastDoc] = useState<any>(undefined);
  const [hasMorePayments, setHasMorePayments] = useState(false);
  const [hasMoreExpenses, setHasMoreExpenses] = useState(false);
  const [hasMoreDues, setHasMoreDues] = useState(false);
  const [expensesLoaded, setExpensesLoaded] = useState(false);
  const [duesLoaded, setDuesLoaded] = useState(false);

  // PDF data
  const [pdfPayments, setPdfPayments] = useState<Payment[]>([]);
  const [pdfExpenses, setPdfExpenses] = useState<Expense[]>([]);
  const [pdfDues, setPdfDues] = useState<Due[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Payment states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeletePaymentModalOpen, setIsDeletePaymentModalOpen] =
    useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isAddingPayment, setIsAddingPayment] = useState(false);

  // Expense states
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isDeleteExpenseModalOpen, setIsDeleteExpenseModalOpen] =
    useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isAddingExpense, setIsAddingExpense] = useState(false);

  // Due states
  const [isDueModalOpen, setIsDueModalOpen] = useState(false);
  const [isDeleteDueModalOpen, setIsDeleteDueModalOpen] = useState(false);
  const [selectedDue, setSelectedDue] = useState<Due | null>(null);
  const [isAddingDue, setIsAddingDue] = useState(false);

  // Statement states
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Payment form
  const {
    register: registerPayment,
    handleSubmit: handleSubmitPayment,
    formState: { errors: errorsPayment },
    reset: resetPayment,
    control: controlPayment,
  } = useForm<PaymentFormValues>({
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      status: "paid",
    },
  });

  // Expense form
  const {
    register: registerExpense,
    handleSubmit: handleSubmitExpense,
    formState: { errors: errorsExpense },
    reset: resetExpense,
  } = useForm<ExpenseFormValues>({
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  // Due form
  const {
    register: registerDue,
    handleSubmit: handleSubmitDue,
    formState: { errors: errorsDue },
    reset: resetDue,
  } = useForm<DueFormValues>({
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const refreshPayments = async () => {
    if (!id) return;
    const result = await getPaymentsPaginated(id);
    setPayments(result.items);
    setPaymentsLastDoc(result.lastDoc);
    setHasMorePayments(result.hasMore);
  };

  const refreshExpenses = async () => {
    if (!id) return;
    const result = await getExpensesPaginated(id);
    setExpenses(result.items);
    setExpensesLastDoc(result.lastDoc);
    setHasMoreExpenses(result.hasMore);
    setExpensesLoaded(true);
  };

  const refreshDues = async () => {
    if (!id) return;
    const result = await getDuesPaginated(id);
    setDues(result.items);
    setDuesLastDoc(result.lastDoc);
    setHasMoreDues(result.hasMore);
    setDuesLoaded(true);
  };

  useEffect(() => {
    const fetchRentalDetails = async () => {
      if (!id || !currentUser) return;
      try {
        const fetchedRental = await getRentalById(id);
        if (!fetchedRental) {
          toast.error("Rental not found");
          navigate("/rentals");
          return;
        }
        setRental(fetchedRental);

        // Fetch first page of payments (default tab)
        const paymentResult = await getPaymentsPaginated(id);
        setPayments(paymentResult.items);
        setPaymentsLastDoc(paymentResult.lastDoc);
        setHasMorePayments(paymentResult.hasMore);

        const [fetchedAsset, fetchedContact] = await Promise.all([
          getAssetById(fetchedRental.assetId),
          getContactById(fetchedRental.contactId),
        ]);
        setAsset(fetchedAsset);
        setContact(fetchedContact);
      } catch (error) {
        toast.error("Failed to load rental details");
      } finally {
        setLoading(false);
      }
    };
    fetchRentalDetails();
  }, [id, currentUser, navigate]);

  const handleTabChange = async (tab: "payments" | "expenses" | "dues") => {
    setTabState(tab);
    if (tab === "expenses" && !expensesLoaded && id) {
      await refreshExpenses();
    }
    if (tab === "dues" && !duesLoaded && id) {
      await refreshDues();
    }
  };

  const loadMorePayments = async () => {
    if (!id || !paymentsLastDoc) return;
    const result = await getPaymentsPaginated(id, paymentsLastDoc);
    setPayments((prev) => [...prev, ...result.items]);
    setPaymentsLastDoc(result.lastDoc);
    setHasMorePayments(result.hasMore);
  };

  const loadMoreExpenses = async () => {
    if (!id || !expensesLastDoc) return;
    const result = await getExpensesPaginated(id, expensesLastDoc);
    setExpenses((prev) => [...prev, ...result.items]);
    setExpensesLastDoc(result.lastDoc);
    setHasMoreExpenses(result.hasMore);
  };

  const loadMoreDues = async () => {
    if (!id || !duesLastDoc) return;
    const result = await getDuesPaginated(id, duesLastDoc);
    setDues((prev) => [...prev, ...result.items]);
    setDuesLastDoc(result.lastDoc);
    setHasMoreDues(result.hasMore);
  };

  // Payment handlers
  const openAddPaymentModal = () => {
    setSelectedPayment(null);
    setIsAddingPayment(true);
    resetPayment({
      amount: rental?.rate || 0,
      date: format(new Date(), "yyyy-MM-dd"),
      status: "paid",
      notes: "",
    });
    setIsPaymentModalOpen(true);
  };

  const openEditPaymentModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsAddingPayment(false);
    resetPayment({
      amount: payment.amount,
      date: format(payment.date, "yyyy-MM-dd"),
      status: payment.status,
      notes: payment.notes || "",
    });
    setIsPaymentModalOpen(true);
  };

  const confirmDeletePayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDeletePaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (data: PaymentFormValues) => {
    if (!rental || !id) return;
    try {
      if (isAddingPayment) {
        await addPayment(id, {
          ...data,
          amount: Number(data.amount),
          date: new Date(data.date),
        });
        if (rental.rateType === "monthly") {
          const nextDate = new Date();
          nextDate.setMonth(nextDate.getMonth() + 1);
          await updateRental(id, { nextPaymentDate: nextDate });
        } else {
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + 1);
          await updateRental(id, { nextPaymentDate: nextDate });
        }
        toast.success("Payment added successfully");
      } else if (selectedPayment) {
        await updatePayment(id, selectedPayment.id, {
          ...data,
          amount: Number(data.amount),
          date: new Date(data.date),
        });
        toast.success("Payment updated successfully");
      }
      const updatedRental = await getRentalById(id);
      setRental(updatedRental);
      await refreshPayments();
      setIsPaymentModalOpen(false);
    } catch {
      toast.error("Failed to save payment");
    }
  };

  const handleDeletePayment = async () => {
    if (!rental || !id || !selectedPayment) return;
    try {
      await deletePayment(id, selectedPayment.id);
      const updatedRental = await getRentalById(id);
      setRental(updatedRental);
      await refreshPayments();
      toast.success("Payment deleted successfully");
      setIsDeletePaymentModalOpen(false);
    } catch {
      toast.error("Failed to delete payment");
    }
  };

  // Expense handlers
  const openAddExpenseModal = () => {
    setSelectedExpense(null);
    setIsAddingExpense(true);
    resetExpense({
      amount: 0,
      date: format(new Date(), "yyyy-MM-dd"),
      description: "",
    });
    setIsExpenseModalOpen(true);
  };

  const openEditExpenseModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsAddingExpense(false);
    resetExpense({
      amount: expense.amount,
      date: format(expense.date, "yyyy-MM-dd"),
      description: expense.description,
    });
    setIsExpenseModalOpen(true);
  };

  const confirmDeleteExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDeleteExpenseModalOpen(true);
  };

  const handleExpenseSubmit = async (data: ExpenseFormValues) => {
    if (!rental || !id) return;
    try {
      if (isAddingExpense) {
        await addExpense(id, {
          ...data,
          amount: Number(data.amount),
          date: new Date(data.date),
        });
        toast.success("Expense added successfully");
      } else if (selectedExpense) {
        await updateExpense(id, selectedExpense.id, {
          ...data,
          amount: Number(data.amount),
          date: new Date(data.date),
        });
        toast.success("Expense updated successfully");
      }
      const updatedRental = await getRentalById(id);
      setRental(updatedRental);
      await refreshExpenses();
      setIsExpenseModalOpen(false);
    } catch {
      toast.error("Failed to save expense");
    }
  };

  const handleDeleteExpense = async () => {
    if (!rental || !id || !selectedExpense) return;
    try {
      await deleteExpense(id, selectedExpense.id);
      const updatedRental = await getRentalById(id);
      setRental(updatedRental);
      await refreshExpenses();
      toast.success("Expense deleted successfully");
      setIsDeleteExpenseModalOpen(false);
    } catch {
      toast.error("Failed to delete expense");
    }
  };

  // Due handlers
  const openAddDueModal = () => {
    setSelectedDue(null);
    setIsAddingDue(true);
    resetDue({
      amount: 0,
      date: format(new Date(), "yyyy-MM-dd"),
      description: "",
    });
    setIsDueModalOpen(true);
  };

  const openEditDueModal = (due: Due) => {
    setSelectedDue(due);
    setIsAddingDue(false);
    resetDue({
      amount: due.amount,
      date: format(due.date, "yyyy-MM-dd"),
      description: due.description,
    });
    setIsDueModalOpen(true);
  };

  const confirmDeleteDue = (due: Due) => {
    setSelectedDue(due);
    setIsDeleteDueModalOpen(true);
  };

  const handleDueSubmit = async (data: DueFormValues) => {
    if (!rental || !id) return;
    try {
      if (isAddingDue) {
        await addDue(id, {
          ...data,
          amount: Number(data.amount),
          date: new Date(data.date),
        });
        toast.success("Due added successfully");
      } else if (selectedDue) {
        await updateDue(id, selectedDue.id, {
          ...data,
          amount: Number(data.amount),
          date: new Date(data.date),
        });
        toast.success("Due updated successfully");
      }
      const updatedRental = await getRentalById(id);
      setRental(updatedRental);
      await refreshDues();
      setIsDueModalOpen(false);
    } catch {
      toast.error("Failed to save due");
    }
  };

  const handleDeleteDue = async () => {
    if (!rental || !id || !selectedDue) return;
    try {
      await deleteDue(id, selectedDue.id);
      const updatedRental = await getRentalById(id);
      setRental(updatedRental);
      await refreshDues();
      toast.success("Due deleted successfully");
      setIsDeleteDueModalOpen(false);
    } catch {
      toast.error("Failed to delete due");
    }
  };

  // PDF generation
  const openPdfModal = async () => {
    if (!id) return;
    setPdfLoading(true);
    setIsPdfModalOpen(true);
    try {
      const [allPayments, allExpenses, allDues] = await Promise.all([
        getAllPayments(id),
        getAllExpenses(id),
        getAllDues(id),
      ]);
      setPdfPayments(allPayments);
      setPdfExpenses(allExpenses);
      setPdfDues(allDues);
    } catch {
      toast.error("Failed to load statement data");
    } finally {
      setPdfLoading(false);
    }
  };

  const now = new Date();
  const formattedDateTime = format(now, "yyyy-MM-dd_HH_mm_ss");
  const { toPDF, targetRef } = usePDF({
    filename: `Rental_Statement_${formattedDateTime}.pdf`,
  });

  const totalPayments = rental?.totalPayments ?? 0;
  const totalExpenses = rental?.totalExpenses ?? 0;
  const totalDues = rental?.totalDues ?? 0;
  const netIncome = rental?.netIncome ?? 0;

  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
  const [tabState, setTabState] = useState<"payments" | "expenses" | "dues">(
    "payments"
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">
          Rental details not found. Please try again.
        </p>
        <Button
          variant="primary"
          className="mt-4"
          onClick={() => navigate("/rentals")}
        >
          Back to Rentals
        </Button>
      </div>
    );
  }

  if (!asset || !contact) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-2">
          {!asset && !contact
            ? "Asset and contact details not found for this rental."
            : !asset
            ? "Asset details not found for this rental."
            : "Contact details not found for this rental."}
        </p>
        <p className="text-gray-600 mb-4">
          Please edit the rental and add a valid{" "}
          {!asset && !contact
            ? "asset and contact"
            : !asset
            ? "asset"
            : "contact"}
          .
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="primary" onClick={() => navigate(`/rentals/${id}`)}>
            Edit Rental
          </Button>
          <Button variant="outline" onClick={() => navigate("/rentals")}>
            Back to Rentals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          icon={<ArrowLeft size={16} />}
          onClick={() => navigate("/rentals")}
        >
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Rental Details</h1>
        <div className="flex-grow"></div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<FileText size={16} />}
            onClick={openPdfModal}
          >
            Statement
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Edit size={16} />}
            onClick={() => navigate(`/rentals/${id}`)}
          >
            Edit Rental
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Rental Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="flex items-center gap-4">
              <Badge
                color={rental.badgeColor}
                character={rental.badgeCharacter}
                size="lg"
              />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {asset.name}
                </h2>
                <p className="text-gray-500 text-sm">
                  ID: {rental.id.substring(0, 8)}
                </p>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p
                    className={`font-medium ${
                      rental.status === "active"
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {rental.status === "active" ? "Active" : "Ended"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rate</p>
                  <p className="font-medium text-gray-900">
                    ₹{rental.rate.toLocaleString()} / {rental.rateType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Due</p>
                  {totalDues > 0 ? (
                    <p className="font-medium text-red-600">
                      ₹{totalDues.toLocaleString()}
                    </p>
                  ) : (
                    <p className="font-medium text-green-600">No Due</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium text-gray-900">
                  {format(rental.startDate, "MMM dd, yyyy")}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Next Payment Due</p>
                <p
                  className={`font-medium ${
                    isAfter(new Date(), rental.nextPaymentDate)
                      ? "text-red-600"
                      : "text-gray-900"
                  }`}
                >
                  {format(rental.nextPaymentDate, "MMM dd, yyyy")}
                  {isAfter(new Date(), rental.nextPaymentDate) && " (Overdue)"}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Asset Details</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="text-sm text-gray-900">{asset.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Registration/ID</p>
                    <p className="text-sm text-gray-900">
                      {asset.registrationNumber}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Contact Details</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm text-gray-900">{contact.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">{contact.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Alt. Phone</p>
                    <p className="text-sm text-gray-900">
                      {contact.alternatePhone}
                    </p>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsIdCardModalOpen(true)}
                    >
                      View ID Cards
                    </Button>
                  </div>
                  <Modal
                    isOpen={isIdCardModalOpen}
                    onClose={() => setIsIdCardModalOpen(false)}
                    title="ID Card Details"
                    size="lg"
                  >
                    <div
                      className="space-y-6 w-full overflow-y-auto"
                      style={{ maxHeight: "60vh" }}
                    >
                      {[contact.idCard1, contact.idCard2].map(
                        (idCard, idx) =>
                          idCard && (
                            <div key={idx} className="w-full">
                              <h3 className="font-semibold mb-2">
                                ID Card {idx + 1}: {idCard.type}
                              </h3>
                              <div className="flex flex-col gap-6 w-full max-w-full">
                                {idCard.front && (
                                  <div className="w-full max-w-full">
                                    <p className="text-xs text-gray-500 mb-1">
                                      Front
                                    </p>
                                    <img
                                      src={idCard.front.url}
                                      alt={idCard.front.name}
                                      className="w-full max-w-full h-auto rounded border"
                                    />
                                    <p className="text-xs text-gray-400 mt-1 truncate">
                                      {idCard.front.name}
                                    </p>
                                  </div>
                                )}
                                {idCard.back && (
                                  <div className="w-full max-w-full">
                                    <p className="text-xs text-gray-500 mb-1">
                                      Back
                                    </p>
                                    <img
                                      src={idCard.back.url}
                                      alt={idCard.back.name}
                                      className="w-full max-w-full h-auto rounded border"
                                    />
                                    <p className="text-xs text-gray-400 mt-1 truncate">
                                      {idCard.back.name}
                                    </p>
                                  </div>
                                )}
                                {!idCard.front && !idCard.back && (
                                  <p className="text-gray-400 italic">
                                    No images uploaded
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                      )}
                    </div>
                    <div className="flex justify-end mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setIsIdCardModalOpen(false)}
                      >
                        Close
                      </Button>
                    </div>
                  </Modal>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Financial Summary
              </h2>
              <CircleDollarSign size={20} className="text-gray-500" />
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Total Payments</p>
                  <p className="text-green-600 font-medium">
                    ₹{totalPayments.toLocaleString()}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Total Expenses</p>
                  <p className="text-red-600 font-medium">
                    ₹{totalExpenses.toLocaleString()}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <p className="text-gray-900 font-medium">Net Income</p>
                  <p
                    className={`font-semibold ${
                      netIncome >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ₹{netIncome.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right column - Payments, Expenses, Dues */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Section for Payments, Expenses, Dues */}
          <div>
            <Card className="mb-4">
              <div className="flex border-b border-gray-200 bg-white rounded-t-lg overflow-x-auto">
                {[
                  { label: "Payments", key: "payments" },
                  { label: "Expenses", key: "expenses" },
                  { label: "Dues", key: "dues" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    className={`py-2 px-6 text-sm font-semibold focus:outline-none transition-colors
                  ${
                    tabState === tab.key
                      ? "border-b-2 border-blue-600 text-blue-700 bg-white"
                      : "text-gray-600 hover:text-blue-700"
                  }
                  ${tabState === tab.key ? "cursor-default" : ""}
                `}
                    onClick={() =>
                      handleTabChange(
                        tab.key as "payments" | "expenses" | "dues"
                      )
                    }
                    type="button"
                    style={{
                      borderTopLeftRadius: tab.key === "payments" ? 8 : 0,
                      borderTopRightRadius: tab.key === "dues" ? 8 : 0,
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </Card>
            {/* Tab Panels */}
            <div>
              {/* Payments Tab */}
              {tabState === "payments" && (
                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Payments
                    </h2>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<PlusCircle size={16} />}
                      onClick={openAddPaymentModal}
                    >
                      Add Payment
                    </Button>
                  </CardHeader>
                  <CardBody className="p-0">
                    {payments.length > 0 ? (
                      <div className="flex flex-col gap-4 p-4">
                        {payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="bg-white rounded-lg shadow border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 overflow-x-auto"
                          >
                            <div className="flex-1 min-w-0 flex flex-col sm:flex-row gap-2 sm:gap-6 items-start sm:items-center w-full">
                              <div className="min-w-[110px] flex-shrink-0">
                                <div className="text-xs text-gray-500">
                                  Date
                                </div>
                                <div className="font-medium text-gray-900 whitespace-nowrap">
                                  {format(payment.date, "MMM dd, yyyy")}
                                </div>
                              </div>
                              <div className="min-w-[120px] flex-shrink-0">
                                <div className="text-xs text-gray-500">
                                  Amount
                                </div>
                                <div className="font-semibold text-green-700 whitespace-nowrap">
                                  ₹{payment.amount.toLocaleString()}
                                </div>
                              </div>
                              <div className="min-w-[60px] flex-shrink-0">
                                <div className="text-xs text-gray-500">
                                  Status
                                </div>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                      ${
                                        payment.status === "paid"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-yellow-100 text-yellow-800"
                                      }`}
                                >
                                  {payment.status === "paid"
                                    ? "Paid"
                                    : "Pending"}
                                </span>
                              </div>
                              <div className="min-w-0 max-w-xs flex-1">
                                <div className="text-xs text-gray-500">
                                  Notes
                                </div>
                                <div className="truncate text-gray-700 text-sm">
                                  {payment.notes || "-"}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                icon={<Edit size={16} />}
                                onClick={() => openEditPaymentModal(payment)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                icon={<Trash2 size={16} />}
                                onClick={() => confirmDeletePayment(payment)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                        {hasMorePayments && (
                          <div className="flex justify-center py-2">
                            <Button
                              variant="outline"
                              onClick={loadMorePayments}
                            >
                              Load More Payments
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 px-4 text-center">
                        <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">
                          No payments recorded yet.
                        </p>
                        <Button
                          variant="primary"
                          icon={<PlusCircle size={18} />}
                          onClick={openAddPaymentModal}
                        >
                          Add First Payment
                        </Button>
                      </div>
                    )}
                  </CardBody>
                </Card>
              )}
              {/* Expenses Tab */}
              {tabState === "expenses" && (
                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Expenses
                    </h2>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<PlusCircle size={16} />}
                      onClick={openAddExpenseModal}
                    >
                      Add Expense
                    </Button>
                  </CardHeader>
                  <CardBody className="p-0">
                    {expenses.length > 0 ? (
                      <div className="flex flex-col gap-4 p-4">
                        {expenses.map((expense) => (
                          <div
                            key={expense.id}
                            className="bg-white rounded-lg shadow border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 overflow-x-auto"
                          >
                            <div className="flex-1 min-w-0 flex flex-col sm:flex-row gap-2 sm:gap-6 items-start sm:items-center">
                              <div className="min-w-[110px] flex-shrink-0">
                                <div className="text-xs text-gray-500">
                                  Date
                                </div>
                                <div className="font-medium text-gray-900 whitespace-nowrap">
                                  {format(expense.date, "MMM dd, yyyy")}
                                </div>
                              </div>
                              <div className="min-w-[120px] flex-shrink-0">
                                <div className="text-xs text-gray-500">
                                  Amount
                                </div>
                                <div className="font-semibold text-red-700 whitespace-nowrap">
                                  ₹{expense.amount.toLocaleString()}
                                </div>
                              </div>
                              <div className="min-w-0 max-w-xs flex-1">
                                <div className="text-xs text-gray-500">
                                  Description
                                </div>
                                <div className="truncate text-gray-700 text-sm">
                                  {expense.description}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                icon={<Edit size={16} />}
                                onClick={() => openEditExpenseModal(expense)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                icon={<Trash2 size={16} />}
                                onClick={() => confirmDeleteExpense(expense)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                        {hasMoreExpenses && (
                          <div className="flex justify-center py-2">
                            <Button
                              variant="outline"
                              onClick={loadMoreExpenses}
                            >
                              Load More Expenses
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 px-4 text-center">
                        <ReceiptText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">
                          No expenses recorded yet.
                        </p>
                        <Button
                          variant="primary"
                          icon={<PlusCircle size={18} />}
                          onClick={openAddExpenseModal}
                        >
                          Add First Expense
                        </Button>
                      </div>
                    )}
                  </CardBody>
                </Card>
              )}
              {/* Dues Tab */}
              {tabState === "dues" && (
                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Due Amounts
                    </h2>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<PlusCircle size={16} />}
                      onClick={openAddDueModal}
                    >
                      Add Due
                    </Button>
                  </CardHeader>
                  <CardBody className="p-0">
                    {dues.length > 0 ? (
                      <div className="flex flex-col gap-4 p-4">
                        {dues.map((due) => (
                          <div
                            key={due.id}
                            className="bg-white rounded-lg shadow border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 overflow-x-auto"
                          >
                            <div className="flex-1 min-w-0 flex flex-col sm:flex-row gap-2 sm:gap-6 items-start sm:items-center">
                              <div className="min-w-[110px] flex-shrink-0">
                                <div className="text-xs text-gray-500">
                                  Due Date
                                </div>
                                <div className="font-medium text-gray-900 whitespace-nowrap">
                                  {format(due.date, "MMM dd, yyyy")}
                                </div>
                              </div>
                              <div className="min-w-[120px] flex-shrink-0">
                                <div className="text-xs text-gray-500">
                                  Amount
                                </div>
                                <div className="font-semibold text-orange-700 whitespace-nowrap">
                                  ₹{due.amount.toLocaleString()}
                                </div>
                              </div>
                              <div className="min-w-0 max-w-xs flex-1">
                                <div className="text-xs text-gray-500">
                                  Notes
                                </div>
                                <div className="truncate text-gray-700 text-sm">
                                  {due.description}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                icon={<Edit size={16} />}
                                onClick={() => openEditDueModal(due)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                icon={<Trash2 size={16} />}
                                onClick={() => confirmDeleteDue(due)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                        {hasMoreDues && (
                          <div className="flex justify-center py-2">
                            <Button variant="outline" onClick={loadMoreDues}>
                              Load More Dues
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 px-4 text-center">
                        <CalendarClock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">
                          No due amounts recorded yet.
                        </p>
                        <Button
                          variant="primary"
                          icon={<PlusCircle size={18} />}
                          onClick={openAddDueModal}
                        >
                          Add First Due
                        </Button>
                      </div>
                    )}
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={isAddingPayment ? "Add Payment" : "Edit Payment"}
        size="md"
      >
        <form onSubmit={handleSubmitPayment(handlePaymentSubmit)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Amount (₹)"
                id="amount"
                type="number"
                min="0"
                placeholder="Enter amount"
                error={errorsPayment.amount?.message}
                {...registerPayment("amount", {
                  required: "Amount is required",
                  min: { value: 0, message: "Amount must be positive" },
                  valueAsNumber: true,
                })}
              />
              <Input
                label="Date"
                id="date"
                type="date"
                error={errorsPayment.date?.message}
                {...registerPayment("date", {
                  required: "Date is required",
                })}
              />
            </div>
            <Controller
              control={controlPayment}
              name="status"
              rules={{ required: "Status is required" }}
              render={({ field }) => (
                <Select
                  label="Status"
                  id="status"
                  options={[
                    { value: "paid", label: "Paid" },
                    { value: "pending", label: "Pending" },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errorsPayment.status?.message}
                />
              )}
            />
            <Textarea
              label="Notes (Optional)"
              id="notes"
              placeholder="Add any payment notes"
              rows={3}
              error={errorsPayment.notes?.message}
              {...registerPayment("notes")}
            />
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPaymentModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" icon={<Save size={18} />}>
                {isAddingPayment ? "Add Payment" : "Update Payment"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Payment Modal */}
      <Modal
        isOpen={isDeletePaymentModalOpen}
        onClose={() => setIsDeletePaymentModalOpen(false)}
        title="Confirm Delete"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this payment of ₹
            {selectedPayment?.amount.toLocaleString()}? This action cannot be
            undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsDeletePaymentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeletePayment}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title={isAddingExpense ? "Add Expense" : "Edit Expense"}
        size="md"
      >
        <form onSubmit={handleSubmitExpense(handleExpenseSubmit)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Amount (₹)"
                id="expenseAmount"
                type="number"
                min="0"
                placeholder="Enter amount"
                error={errorsExpense.amount?.message}
                {...registerExpense("amount", {
                  required: "Amount is required",
                  min: { value: 0, message: "Amount must be positive" },
                  valueAsNumber: true,
                })}
              />
              <Input
                label="Date"
                id="expenseDate"
                type="date"
                error={errorsExpense.date?.message}
                {...registerExpense("date", {
                  required: "Date is required",
                })}
              />
            </div>
            <Textarea
              label="Description"
              id="description"
              placeholder="Describe the expense"
              rows={3}
              error={errorsExpense.description?.message}
              {...registerExpense("description", {
                required: "Description is required",
              })}
            />
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsExpenseModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" icon={<Save size={18} />}>
                {isAddingExpense ? "Add Expense" : "Update Expense"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Expense Modal */}
      <Modal
        isOpen={isDeleteExpenseModalOpen}
        onClose={() => setIsDeleteExpenseModalOpen(false)}
        title="Confirm Delete"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this expense of ₹
            {selectedExpense?.amount.toLocaleString()}? This action cannot be
            undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteExpenseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteExpense}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Due Modal */}
      <Modal
        isOpen={isDueModalOpen}
        onClose={() => setIsDueModalOpen(false)}
        title={isAddingDue ? "Add Due" : "Edit Due"}
        size="md"
      >
        <form onSubmit={handleSubmitDue(handleDueSubmit)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Amount (₹)"
                id="dueAmount"
                type="number"
                min="0"
                placeholder="Enter amount"
                error={errorsDue?.amount?.message}
                {...registerDue("amount", {
                  required: "Amount is required",
                  min: { value: 0, message: "Amount must be positive" },
                  valueAsNumber: true,
                })}
              />
              <Input
                label="Due Date"
                id="dueDate"
                type="date"
                error={errorsDue?.date?.message}
                {...registerDue("date", {
                  required: "Date is required",
                })}
              />
            </div>
            <Textarea
              label="Notes"
              id="dueDescription"
              placeholder="Describe the due"
              rows={3}
              error={errorsDue?.description?.message}
              {...registerDue("description", {
                required: "Description is required",
              })}
            />
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDueModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" icon={<Save size={18} />}>
                {isAddingDue ? "Add Due" : "Update Due"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Due Modal */}
      <Modal
        isOpen={isDeleteDueModalOpen}
        onClose={() => setIsDeleteDueModalOpen(false)}
        title="Confirm Delete"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this due of ₹
            {selectedDue?.amount.toLocaleString()}? This action cannot be
            undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDueModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteDue}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* PDF Statement Modal */}
      <Modal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        title="Rental Statement"
        size="xl"
      >
        <div className="space-y-4">
          {pdfLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <div
                className="bg-white p-4 w-full justify-center"
                ref={targetRef}
                style={{ overflow: "visible" }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Rental Statement
                  </h2>
                  <p className="text-gray-600">
                    Generated on {format(new Date(), "MMMM dd, yyyy")}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Rental Information
                    </h3>
                    <div className="space-y-1">
                      <p>
                        <span className="font-medium">Asset:</span> {asset.name}{" "}
                        ({asset.category})
                      </p>
                      <p>
                        <span className="font-medium">ID/Reg Number:</span>{" "}
                        {asset.registrationNumber}
                      </p>
                      <p>
                        <span className="font-medium">Start Date:</span>{" "}
                        {format(rental.startDate, "MMMM dd, yyyy")}
                      </p>
                      <p>
                        <span className="font-medium">Rate:</span> ₹
                        {rental.rate.toLocaleString()} / {rental.rateType}
                      </p>
                      <p>
                        <span className="font-medium">Status:</span>{" "}
                        {rental.status === "active" ? "Active" : "Ended"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Contact Information
                    </h3>
                    <div className="space-y-1">
                      <p>
                        <span className="font-medium">Name:</span>{" "}
                        {contact.name}
                      </p>
                      <p>
                        <span className="font-medium">Phone:</span>{" "}
                        {contact.phone}
                      </p>
                      <p>
                        <span className="font-medium">Alternative Phone:</span>{" "}
                        {contact.alternatePhone}
                      </p>
                      <p>
                        <span className="font-medium">Address:</span>{" "}
                        {contact.address}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">
                    Payment History
                  </h3>
                  {pdfPayments.length > 0 ? (
                    <table
                      className="min-w-full border border-gray-300"
                      style={{ tableLayout: "auto" }}
                    >
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="py-2 px-4 border-b text-left">Date</th>
                          <th className="py-2 px-4 border-b text-left">
                            Amount
                          </th>
                          <th className="py-2 px-4 border-b text-left">
                            Status
                          </th>
                          <th className="py-2 px-4 border-b text-left">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pdfPayments.map((payment) => (
                          <tr key={payment.id} className="border-b">
                            <td className="py-2 px-4">
                              {format(payment.date, "MMM dd, yyyy")}
                            </td>
                            <td className="py-2 px-4">
                              ₹{payment.amount.toLocaleString()}
                            </td>
                            <td className="py-2 px-4">
                              {payment.status === "paid" ? "Paid" : "Pending"}
                            </td>
                            <td className="py-2 px-4">
                              {payment.notes || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-gray-500 italic">
                      No payments recorded
                    </p>
                  )}
                </div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">
                    Expense History
                  </h3>
                  {pdfExpenses.length > 0 ? (
                    <table
                      className="min-w-full border border-gray-300"
                      style={{ tableLayout: "auto" }}
                    >
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="py-2 px-4 border-b text-left">Date</th>
                          <th className="py-2 px-4 border-b text-left">
                            Amount
                          </th>
                          <th className="py-2 px-4 border-b text-left">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pdfExpenses.map((expense) => (
                          <tr key={expense.id} className="border-b">
                            <td className="py-2 px-4">
                              {format(expense.date, "MMM dd, yyyy")}
                            </td>
                            <td className="py-2 px-4">
                              ₹{expense.amount.toLocaleString()}
                            </td>
                            <td className="py-2 px-4">
                              {expense.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-gray-500 italic">
                      No expenses recorded
                    </p>
                  )}
                </div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Due Amounts</h3>
                  {pdfDues.length > 0 ? (
                    <table
                      className="min-w-full border border-gray-300"
                      style={{ tableLayout: "auto" }}
                    >
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="py-2 px-4 border-b text-left">
                            Due Date
                          </th>
                          <th className="py-2 px-4 border-b text-left">
                            Amount
                          </th>
                          <th className="py-2 px-4 border-b text-left">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pdfDues.map((due) => (
                          <tr key={due.id} className="border-b">
                            <td className="py-2 px-4">
                              {format(due.date, "MMM dd, yyyy")}
                            </td>
                            <td className="py-2 px-4">
                              ₹{due.amount.toLocaleString()}
                            </td>
                            <td className="py-2 px-4">{due.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-gray-500 italic">
                      No due amounts recorded
                    </p>
                  )}
                </div>
                <div className="border-t border-gray-300 pt-4">
                  <h3 className="text-lg font-semibold mb-3">
                    Financial Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="flex justify-between py-1">
                        <span className="font-medium">Total Payments:</span>
                        <span className="text-green-600">
                          ₹{totalPayments.toLocaleString()}
                        </span>
                      </p>
                      <p className="flex justify-between py-1">
                        <span className="font-medium">Total Expenses:</span>
                        <span className="text-red-600">
                          ₹{totalExpenses.toLocaleString()}
                        </span>
                      </p>
                      <p className="flex justify-between border-t border-gray-300 mt-2 pt-2">
                        <span className="font-bold">Net Income:</span>
                        <span
                          className={`font-bold ${
                            netIncome >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          ₹{netIncome.toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsPdfModalOpen(false)}
                >
                  Close
                </Button>
                <Button variant="primary" onClick={() => toPDF()}>
                  Download PDF
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default RentalDetails;
