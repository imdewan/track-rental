import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  writeBatch,
  orderBy,
  limit,
  startAfter,
  deleteField,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "./config";
import { Asset, Contact, Rental, Payment, Expense, Due, PaginatedResult } from "../types";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./config";
import { getAuth } from "firebase/auth";

// Generic helper to convert Firestore timestamps to Dates
const convertTimestamps = (data: any): any => {
  if (!data) return data;

  const result = { ...data };

  Object.keys(result).forEach((key) => {
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toDate();
    } else if (typeof result[key] === "object" && result[key] !== null) {
      result[key] = convertTimestamps(result[key]);
    }
  });

  return result;
};

// Assets
export const getAssets = async (userId: string): Promise<Asset[]> => {
  try {
    const q = query(collection(db, "assets"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...convertTimestamps(data),
      } as Asset;
    });
  } catch (error) {
    console.error("Error getting assets:", error);
    throw error;
  }
};

export const getAssetById = async (id: string): Promise<Asset | null> => {
  try {
    const docRef = doc(db, "assets", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...convertTimestamps(docSnap.data()),
      } as Asset;
    }
    return null;
  } catch (error) {
    console.error("Error getting asset:", error);
    throw error;
  }
};

export const addAsset = async (
  asset: Omit<Asset, "id" | "createdAt">,
  userId: string
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "assets"), {
      ...asset,
      userId,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding asset:", error);
    throw error;
  }
};

export const updateAsset = async (
  id: string,
  asset: Partial<Asset>
): Promise<void> => {
  try {
    await updateDoc(doc(db, "assets", id), asset);
  } catch (error) {
    console.error("Error updating asset:", error);
    throw error;
  }
};

export const deleteAsset = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "assets", id));
  } catch (error) {
    console.error("Error deleting asset:", error);
    throw error;
  }
};

// Contacts
export const getContacts = async (userId: string): Promise<Contact[]> => {
  try {
    const q = query(collection(db, "contacts"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...convertTimestamps(data),
      } as Contact;
    });
  } catch (error) {
    console.error("Error getting contacts:", error);
    throw error;
  }
};

export const getContactById = async (id: string): Promise<Contact | null> => {
  try {
    const docRef = doc(db, "contacts", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...convertTimestamps(docSnap.data()),
      } as Contact;
    }
    return null;
  } catch (error) {
    console.error("Error getting contact:", error);
    throw error;
  }
};

export const addContact = async (
  contact: Omit<Contact, "id" | "createdAt">,
  userId: string
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "contacts"), {
      ...contact,
      userId,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding contact:", error);
    throw error;
  }
};

export const updateContact = async (
  id: string,
  contact: Partial<Contact>
): Promise<void> => {
  try {
    // Fetch the existing contact
    const contactRef = doc(db, "contacts", id);
    const contactSnap = await getDoc(contactRef);

    if (!contactSnap.exists()) {
      throw new Error("Contact not found");
    }

    const oldContact = contactSnap.data();

    // Helper to delete old pic if url is different
    const maybeDeletePic = async (
      oldPic: { url: string; name: string } | null,
      newPic: { url: string; name: string } | null
    ) => {
      if (
        oldPic &&
        newPic &&
        oldPic.url &&
        newPic.url &&
        oldPic.url !== newPic.url
      ) {
        try {
          await deletePic(oldPic.name);
        } catch (e) {
          // Ignore errors for deleting old pic
        }
      }
    };

    // Check idCard1
    if (contact.idCard1 && oldContact.idCard1) {
      await maybeDeletePic(oldContact.idCard1.front, contact.idCard1.front);
      await maybeDeletePic(oldContact.idCard1.back, contact.idCard1.back);
    }
    // Check idCard2
    if (contact.idCard2 && oldContact.idCard2) {
      await maybeDeletePic(oldContact.idCard2.front, contact.idCard2.front);
      await maybeDeletePic(oldContact.idCard2.back, contact.idCard2.back);
    }

    await updateDoc(contactRef, contact);
  } catch (error) {
    console.error("Error updating contact:", error);
    throw error;
  }
};

export const deleteContact = async (id: string): Promise<void> => {
  try {
    // Fetch the existing contact to delete associated pics
    const contactRef = doc(db, "contacts", id);
    const contactSnap = await getDoc(contactRef);

    if (contactSnap.exists()) {
      const contact = contactSnap.data();

      const deleteIfExists = async (
        pic: { url: string; name: string } | null
      ) => {
        if (pic && pic.name) {
          try {
            await deletePic(pic.name);
          } catch (e) {
            // Ignore errors for deleting pic
          }
        }
      };

      if (contact.idCard1) {
        await deleteIfExists(contact.idCard1.front);
        await deleteIfExists(contact.idCard1.back);
      }
      if (contact.idCard2) {
        await deleteIfExists(contact.idCard2.front);
        await deleteIfExists(contact.idCard2.back);
      }
    }

    await deleteDoc(contactRef);
  } catch (error) {
    console.error("Error deleting contact:", error);
    throw error;
  }
};

// Rentals
export const getRentals = async (userId: string): Promise<Rental[]> => {
  try {
    const q = query(collection(db, "rentals"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...convertTimestamps(data),
      } as Rental;
    });
  } catch (error) {
    console.error("Error getting rentals:", error);
    throw error;
  }
};

export const getRentalById = async (id: string): Promise<Rental | null> => {
  try {
    const docRef = doc(db, "rentals", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...convertTimestamps(docSnap.data()),
      } as Rental;
    }
    return null;
  } catch (error) {
    console.error("Error getting rental:", error);
    throw error;
  }
};

export const addRental = async (
  rental: Omit<Rental, "id" | "createdAt" | "totalPayments" | "totalExpenses" | "totalDues" | "netIncome" | "dataVersion" | "payments" | "expenses" | "dues">,
  userId: string
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "rentals"), {
      ...rental,
      userId,
      totalPayments: 0,
      totalExpenses: 0,
      totalDues: 0,
      netIncome: 0,
      dataVersion: 2,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding rental:", error);
    throw error;
  }
};

export const updateRental = async (
  id: string,
  rental: Partial<Rental>
): Promise<void> => {
  try {
    await updateDoc(doc(db, "rentals", id), rental);
  } catch (error) {
    console.error("Error updating rental:", error);
    throw error;
  }
};

export const deleteRental = async (id: string): Promise<void> => {
  try {
    const subcollections = ["payments", "expenses", "dues"];
    for (const sub of subcollections) {
      const snap = await getDocs(collection(db, "rentals", id, sub));
      if (snap.docs.length > 0) {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }
    await deleteDoc(doc(db, "rentals", id));
  } catch (error) {
    console.error("Error deleting rental:", error);
    throw error;
  }
};

const PAGE_SIZE = 15;

// Payments (subcollection)
export const addPayment = async (
  rentalId: string,
  payment: Omit<Payment, "id">
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const paymentRef = doc(collection(db, "rentals", rentalId, "payments"));
    batch.set(paymentRef, { ...payment, id: paymentRef.id });

    const rentalRef = doc(db, "rentals", rentalId);
    const rentalSnap = await getDoc(rentalRef);
    if (!rentalSnap.exists()) throw new Error("Rental not found");
    const rentalData = rentalSnap.data();

    const addedAmount = payment.status === "paid" ? payment.amount : 0;
    const newTotalPayments = (rentalData.totalPayments || 0) + addedAmount;
    batch.update(rentalRef, {
      totalPayments: newTotalPayments,
      netIncome: newTotalPayments - (rentalData.totalExpenses || 0),
    });

    await batch.commit();
  } catch (error) {
    console.error("Error adding payment:", error);
    throw error;
  }
};

export const updatePayment = async (
  rentalId: string,
  paymentId: string,
  payment: Partial<Payment>
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const paymentRef = doc(db, "rentals", rentalId, "payments", paymentId);
    const paymentSnap = await getDoc(paymentRef);
    if (!paymentSnap.exists()) throw new Error("Payment not found");
    const oldPayment = paymentSnap.data();

    batch.update(paymentRef, payment);

    const oldPaidAmount = oldPayment.status === "paid" ? oldPayment.amount : 0;
    const newStatus = payment.status ?? oldPayment.status;
    const newAmount = payment.amount ?? oldPayment.amount;
    const newPaidAmount = newStatus === "paid" ? newAmount : 0;
    const delta = newPaidAmount - oldPaidAmount;

    if (delta !== 0) {
      const rentalRef = doc(db, "rentals", rentalId);
      const rentalSnap = await getDoc(rentalRef);
      const rentalData = rentalSnap.data()!;
      const newTotalPayments = (rentalData.totalPayments || 0) + delta;
      batch.update(rentalRef, {
        totalPayments: newTotalPayments,
        netIncome: newTotalPayments - (rentalData.totalExpenses || 0),
      });
    }

    await batch.commit();
  } catch (error) {
    console.error("Error updating payment:", error);
    throw error;
  }
};

export const deletePayment = async (
  rentalId: string,
  paymentId: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const paymentRef = doc(db, "rentals", rentalId, "payments", paymentId);
    const paymentSnap = await getDoc(paymentRef);
    if (!paymentSnap.exists()) throw new Error("Payment not found");
    const paymentData = paymentSnap.data();

    batch.delete(paymentRef);

    if (paymentData.status === "paid") {
      const rentalRef = doc(db, "rentals", rentalId);
      const rentalSnap = await getDoc(rentalRef);
      const rentalData = rentalSnap.data()!;
      const newTotalPayments = (rentalData.totalPayments || 0) - paymentData.amount;
      batch.update(rentalRef, {
        totalPayments: newTotalPayments,
        netIncome: newTotalPayments - (rentalData.totalExpenses || 0),
      });
    }

    await batch.commit();
  } catch (error) {
    console.error("Error deleting payment:", error);
    throw error;
  }
};

// Expenses (subcollection)
export const addExpense = async (
  rentalId: string,
  expense: Omit<Expense, "id">
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const expenseRef = doc(collection(db, "rentals", rentalId, "expenses"));
    batch.set(expenseRef, { ...expense, id: expenseRef.id });

    const rentalRef = doc(db, "rentals", rentalId);
    const rentalSnap = await getDoc(rentalRef);
    if (!rentalSnap.exists()) throw new Error("Rental not found");
    const rentalData = rentalSnap.data();

    const newTotalExpenses = (rentalData.totalExpenses || 0) + expense.amount;
    batch.update(rentalRef, {
      totalExpenses: newTotalExpenses,
      netIncome: (rentalData.totalPayments || 0) - newTotalExpenses,
    });

    await batch.commit();
  } catch (error) {
    console.error("Error adding expense:", error);
    throw error;
  }
};

export const updateExpense = async (
  rentalId: string,
  expenseId: string,
  expense: Partial<Expense>
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const expenseRef = doc(db, "rentals", rentalId, "expenses", expenseId);
    const expenseSnap = await getDoc(expenseRef);
    if (!expenseSnap.exists()) throw new Error("Expense not found");
    const oldExpense = expenseSnap.data();

    batch.update(expenseRef, expense);

    const delta = (expense.amount ?? oldExpense.amount) - oldExpense.amount;
    if (delta !== 0) {
      const rentalRef = doc(db, "rentals", rentalId);
      const rentalSnap = await getDoc(rentalRef);
      const rentalData = rentalSnap.data()!;
      const newTotalExpenses = (rentalData.totalExpenses || 0) + delta;
      batch.update(rentalRef, {
        totalExpenses: newTotalExpenses,
        netIncome: (rentalData.totalPayments || 0) - newTotalExpenses,
      });
    }

    await batch.commit();
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
};

export const deleteExpense = async (
  rentalId: string,
  expenseId: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const expenseRef = doc(db, "rentals", rentalId, "expenses", expenseId);
    const expenseSnap = await getDoc(expenseRef);
    if (!expenseSnap.exists()) throw new Error("Expense not found");
    const expenseData = expenseSnap.data();

    batch.delete(expenseRef);

    const rentalRef = doc(db, "rentals", rentalId);
    const rentalSnap = await getDoc(rentalRef);
    const rentalData = rentalSnap.data()!;
    const newTotalExpenses = (rentalData.totalExpenses || 0) - expenseData.amount;
    batch.update(rentalRef, {
      totalExpenses: newTotalExpenses,
      netIncome: (rentalData.totalPayments || 0) - newTotalExpenses,
    });

    await batch.commit();
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
};

// Dues (subcollection)
export const addDue = async (
  rentalId: string,
  due: Omit<Due, "id">
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const dueRef = doc(collection(db, "rentals", rentalId, "dues"));
    batch.set(dueRef, { ...due, id: dueRef.id });

    const rentalRef = doc(db, "rentals", rentalId);
    const rentalSnap = await getDoc(rentalRef);
    if (!rentalSnap.exists()) throw new Error("Rental not found");
    const rentalData = rentalSnap.data();

    batch.update(rentalRef, {
      totalDues: (rentalData.totalDues || 0) + due.amount,
    });

    await batch.commit();
  } catch (error) {
    console.error("Error adding due:", error);
    throw error;
  }
};

export const updateDue = async (
  rentalId: string,
  dueId: string,
  due: Partial<Due>
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const dueRef = doc(db, "rentals", rentalId, "dues", dueId);
    const dueSnap = await getDoc(dueRef);
    if (!dueSnap.exists()) throw new Error("Due not found");
    const oldDue = dueSnap.data();

    batch.update(dueRef, due);

    const delta = (due.amount ?? oldDue.amount) - oldDue.amount;
    if (delta !== 0) {
      const rentalRef = doc(db, "rentals", rentalId);
      const rentalSnap = await getDoc(rentalRef);
      const rentalData = rentalSnap.data()!;
      batch.update(rentalRef, {
        totalDues: (rentalData.totalDues || 0) + delta,
      });
    }

    await batch.commit();
  } catch (error) {
    console.error("Error updating due:", error);
    throw error;
  }
};

export const deleteDue = async (
  rentalId: string,
  dueId: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const dueRef = doc(db, "rentals", rentalId, "dues", dueId);
    const dueSnap = await getDoc(dueRef);
    if (!dueSnap.exists()) throw new Error("Due not found");
    const dueData = dueSnap.data();

    batch.delete(dueRef);

    const rentalRef = doc(db, "rentals", rentalId);
    const rentalSnap = await getDoc(rentalRef);
    const rentalData = rentalSnap.data()!;
    batch.update(rentalRef, {
      totalDues: (rentalData.totalDues || 0) - dueData.amount,
    });

    await batch.commit();
  } catch (error) {
    console.error("Error deleting due:", error);
    throw error;
  }
};

// Paginated queries
export const getPaymentsPaginated = async (
  rentalId: string,
  lastDocSnap?: QueryDocumentSnapshot<DocumentData>
): Promise<PaginatedResult<Payment>> => {
  try {
    const paymentsRef = collection(db, "rentals", rentalId, "payments");
    let q = lastDocSnap
      ? query(paymentsRef, orderBy("date", "desc"), startAfter(lastDocSnap), limit(PAGE_SIZE + 1))
      : query(paymentsRef, orderBy("date", "desc"), limit(PAGE_SIZE + 1));

    const snapshot = await getDocs(q);
    const hasMore = snapshot.docs.length > PAGE_SIZE;
    const docs = hasMore ? snapshot.docs.slice(0, PAGE_SIZE) : snapshot.docs;

    return {
      items: docs.map((d) => ({ ...convertTimestamps(d.data()), id: d.id } as Payment)),
      lastDoc: docs.length > 0 ? docs[docs.length - 1] : undefined,
      hasMore,
    };
  } catch (error) {
    console.error("Error getting paginated payments:", error);
    throw error;
  }
};

export const getExpensesPaginated = async (
  rentalId: string,
  lastDocSnap?: QueryDocumentSnapshot<DocumentData>
): Promise<PaginatedResult<Expense>> => {
  try {
    const expensesRef = collection(db, "rentals", rentalId, "expenses");
    let q = lastDocSnap
      ? query(expensesRef, orderBy("date", "desc"), startAfter(lastDocSnap), limit(PAGE_SIZE + 1))
      : query(expensesRef, orderBy("date", "desc"), limit(PAGE_SIZE + 1));

    const snapshot = await getDocs(q);
    const hasMore = snapshot.docs.length > PAGE_SIZE;
    const docs = hasMore ? snapshot.docs.slice(0, PAGE_SIZE) : snapshot.docs;

    return {
      items: docs.map((d) => ({ ...convertTimestamps(d.data()), id: d.id } as Expense)),
      lastDoc: docs.length > 0 ? docs[docs.length - 1] : undefined,
      hasMore,
    };
  } catch (error) {
    console.error("Error getting paginated expenses:", error);
    throw error;
  }
};

export const getDuesPaginated = async (
  rentalId: string,
  lastDocSnap?: QueryDocumentSnapshot<DocumentData>
): Promise<PaginatedResult<Due>> => {
  try {
    const duesRef = collection(db, "rentals", rentalId, "dues");
    let q = lastDocSnap
      ? query(duesRef, orderBy("date", "desc"), startAfter(lastDocSnap), limit(PAGE_SIZE + 1))
      : query(duesRef, orderBy("date", "desc"), limit(PAGE_SIZE + 1));

    const snapshot = await getDocs(q);
    const hasMore = snapshot.docs.length > PAGE_SIZE;
    const docs = hasMore ? snapshot.docs.slice(0, PAGE_SIZE) : snapshot.docs;

    return {
      items: docs.map((d) => ({ ...convertTimestamps(d.data()), id: d.id } as Due)),
      lastDoc: docs.length > 0 ? docs[docs.length - 1] : undefined,
      hasMore,
    };
  } catch (error) {
    console.error("Error getting paginated dues:", error);
    throw error;
  }
};

// Fetch all (for PDF export)
export const getAllPayments = async (rentalId: string): Promise<Payment[]> => {
  try {
    const snapshot = await getDocs(
      query(collection(db, "rentals", rentalId, "payments"), orderBy("date", "desc"))
    );
    return snapshot.docs.map((d) => ({ ...convertTimestamps(d.data()), id: d.id } as Payment));
  } catch (error) {
    console.error("Error getting all payments:", error);
    throw error;
  }
};

export const getAllExpenses = async (rentalId: string): Promise<Expense[]> => {
  try {
    const snapshot = await getDocs(
      query(collection(db, "rentals", rentalId, "expenses"), orderBy("date", "desc"))
    );
    return snapshot.docs.map((d) => ({ ...convertTimestamps(d.data()), id: d.id } as Expense));
  } catch (error) {
    console.error("Error getting all expenses:", error);
    throw error;
  }
};

export const getAllDues = async (rentalId: string): Promise<Due[]> => {
  try {
    const snapshot = await getDocs(
      query(collection(db, "rentals", rentalId, "dues"), orderBy("date", "desc"))
    );
    return snapshot.docs.map((d) => ({ ...convertTimestamps(d.data()), id: d.id } as Due));
  } catch (error) {
    console.error("Error getting all dues:", error);
    throw error;
  }
};

// Migration
export const getUnmigratedRentals = async (userId: string): Promise<Rental[]> => {
  const allRentals = await getRentals(userId);
  return allRentals.filter((r) => !r.dataVersion || r.dataVersion < 2);
};

export const migrateRentalToSubcollections = async (rental: Rental): Promise<void> => {
  const payments: Payment[] = Array.isArray(rental.payments)
    ? rental.payments
    : Object.values(rental.payments || {});
  const expenses: Expense[] = Array.isArray(rental.expenses)
    ? rental.expenses
    : Object.values(rental.expenses || {});
  const dues: Due[] = Array.isArray(rental.dues)
    ? rental.dues
    : Object.values(rental.dues || {});

  const allItems = [
    ...payments.map((p) => ({ type: "payments" as const, data: p })),
    ...expenses.map((e) => ({ type: "expenses" as const, data: e })),
    ...dues.map((d) => ({ type: "dues" as const, data: d })),
  ];

  const BATCH_LIMIT = 499;
  for (let i = 0; i < allItems.length; i += BATCH_LIMIT) {
    const chunk = allItems.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(db);
    for (const item of chunk) {
      const itemRef = doc(db, "rentals", rental.id, item.type, item.data.id);
      batch.set(itemRef, item.data);
    }
    await batch.commit();
  }

  const totalPayments = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalDues = dues.reduce((sum, d) => sum + (d.amount || 0), 0);

  const finalBatch = writeBatch(db);
  const rentalRef = doc(db, "rentals", rental.id);
  finalBatch.update(rentalRef, {
    totalPayments,
    totalExpenses,
    totalDues,
    netIncome: totalPayments - totalExpenses,
    dataVersion: 2,
    payments: deleteField(),
    expenses: deleteField(),
    dues: deleteField(),
  });
  await finalBatch.commit();
};
// Add a picture and return its name and URL
export const addPic = async (
  file: File,
  folder: string = "images"
): Promise<{ name: string; url: string }> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    const userId = user.uid;
    const fileName = `${crypto.randomUUID()}_${file.name}`;
    const storageRef = ref(storage, `${folder}/${userId}/${fileName}`);
    // Compress file if larger than 100kb and is an image
    let uploadFile = file;
    if (file.size > 100 * 1024 && file.type.startsWith("image/")) {
      const img = document.createElement("img");
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      img.src = dataUrl;
      await new Promise((res) => (img.onload = res));
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      let quality = 0.8;
      let blob: Blob | null = null;
      do {
        blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, file.type, quality)
        );
        quality -= 0.1;
      } while (blob && blob.size > 100 * 1024 && quality > 0.2);
      if (blob && blob.size < file.size) {
        uploadFile = new File([blob], file.name, { type: file.type });
      }
    }

    await uploadBytes(storageRef, uploadFile);
    const url = await getDownloadURL(storageRef);
    return { name: fileName, url };
  } catch (error) {
    console.error("Error uploading picture:", error);
    throw error;
  }
};

// Delete a picture by name and return its name and URL (if deleted)
export const deletePic = async (
  name: string,
  folder: string = "images"
): Promise<{ name: string; url: string }> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    const userId = user.uid;
    const storageRef = ref(storage, `${folder}/${userId}/${name}`);
    const url = await getDownloadURL(storageRef);
    await deleteObject(storageRef);
    return { name, url };
  } catch (error) {
    console.error("Error deleting picture:", error);
    throw error;
  }
};
