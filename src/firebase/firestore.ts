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
} from "firebase/firestore";
import { db } from "./config";
import { Asset, Contact, Rental, Payment, Expense } from "../types";
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
  rental: Omit<Rental, "id" | "createdAt">,
  userId: string
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "rentals"), {
      ...rental,
      userId,
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
    await deleteDoc(doc(db, "rentals", id));
  } catch (error) {
    console.error("Error deleting rental:", error);
    throw error;
  }
};

// Payments
export const addPayment = async (
  rentalId: string,
  payment: Omit<Payment, "id">
): Promise<void> => {
  try {
    const rentalRef = doc(db, "rentals", rentalId);
    const rentalDoc = await getDoc(rentalRef);

    if (!rentalDoc.exists()) {
      throw new Error("Rental not found");
    }

    const rentalData = rentalDoc.data();
    const payments = rentalData.payments || [];

    // Create a new payment with ID
    const newPayment = {
      ...payment,
      id: crypto.randomUUID(),
    };

    // Update the rental with the new payment
    await updateDoc(rentalRef, {
      payments: [...payments, newPayment],
    });
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
    const rentalRef = doc(db, "rentals", rentalId);
    const rentalDoc = await getDoc(rentalRef);

    if (!rentalDoc.exists()) {
      throw new Error("Rental not found");
    }

    const rentalData = rentalDoc.data();
    const payments = rentalData.payments || [];

    // Update the payment
    const updatedPayments = payments.map((p: Payment) =>
      p.id === paymentId ? { ...p, ...payment } : p
    );

    // Update the rental with the updated payments
    await updateDoc(rentalRef, {
      payments: updatedPayments,
    });
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
    const rentalRef = doc(db, "rentals", rentalId);
    const rentalDoc = await getDoc(rentalRef);

    if (!rentalDoc.exists()) {
      throw new Error("Rental not found");
    }

    const rentalData = rentalDoc.data();
    const payments = rentalData.payments || [];

    // Filter out the payment to delete
    const updatedPayments = payments.filter((p: Payment) => p.id !== paymentId);

    // Update the rental with the updated payments
    await updateDoc(rentalRef, {
      payments: updatedPayments,
    });
  } catch (error) {
    console.error("Error deleting payment:", error);
    throw error;
  }
};

// Expenses
export const addExpense = async (
  rentalId: string,
  expense: Omit<Expense, "id">
): Promise<void> => {
  try {
    const rentalRef = doc(db, "rentals", rentalId);
    const rentalDoc = await getDoc(rentalRef);

    if (!rentalDoc.exists()) {
      throw new Error("Rental not found");
    }

    const rentalData = rentalDoc.data();
    const expenses = rentalData.expenses || [];

    // Create a new expense with ID
    const newExpense = {
      ...expense,
      id: crypto.randomUUID(),
    };

    // Update the rental with the new expense
    await updateDoc(rentalRef, {
      expenses: [...expenses, newExpense],
    });
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
    const rentalRef = doc(db, "rentals", rentalId);
    const rentalDoc = await getDoc(rentalRef);

    if (!rentalDoc.exists()) {
      throw new Error("Rental not found");
    }

    const rentalData = rentalDoc.data();
    const expenses = rentalData.expenses || [];

    // Update the expense
    const updatedExpenses = expenses.map((e: Expense) =>
      e.id === expenseId ? { ...e, ...expense } : e
    );

    // Update the rental with the updated expenses
    await updateDoc(rentalRef, {
      expenses: updatedExpenses,
    });
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
    const rentalRef = doc(db, "rentals", rentalId);
    const rentalDoc = await getDoc(rentalRef);

    if (!rentalDoc.exists()) {
      throw new Error("Rental not found");
    }

    const rentalData = rentalDoc.data();
    const expenses = rentalData.expenses || [];

    // Filter out the expense to delete
    const updatedExpenses = expenses.filter((e: Expense) => e.id !== expenseId);

    // Update the rental with the updated expenses
    await updateDoc(rentalRef, {
      expenses: updatedExpenses,
    });
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
};

export const addDue = async (
  rentalId: string,
  due: Omit<{ id: string } & Record<string, any>, "id">
): Promise<void> => {
  try {
    const rentalRef = doc(db, "rentals", rentalId);
    const rentalDoc = await getDoc(rentalRef);

    if (!rentalDoc.exists()) {
      throw new Error("Rental not found");
    }

    const rentalData = rentalDoc.data();
    const dues = rentalData.dues || [];

    const newDue = {
      ...due,
      id: crypto.randomUUID(),
    };

    await updateDoc(rentalRef, {
      dues: [...dues, newDue],
    });
  } catch (error) {
    console.error("Error adding due:", error);
    throw error;
  }
};

export const updateDue = async (
  rentalId: string,
  dueId: string,
  due: Partial<Record<string, any>>
): Promise<void> => {
  try {
    const rentalRef = doc(db, "rentals", rentalId);
    const rentalDoc = await getDoc(rentalRef);

    if (!rentalDoc.exists()) {
      throw new Error("Rental not found");
    }

    const rentalData = rentalDoc.data();
    const dues = rentalData.dues || [];

    const updatedDues = dues.map((d: any) =>
      d.id === dueId ? { ...d, ...due } : d
    );

    await updateDoc(rentalRef, {
      dues: updatedDues,
    });
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
    const rentalRef = doc(db, "rentals", rentalId);
    const rentalDoc = await getDoc(rentalRef);

    if (!rentalDoc.exists()) {
      throw new Error("Rental not found");
    }

    const rentalData = rentalDoc.data();
    const dues = rentalData.dues || [];

    const updatedDues = dues.filter((d: any) => d.id !== dueId);

    await updateDoc(rentalRef, {
      dues: updatedDues,
    });
  } catch (error) {
    console.error("Error deleting due:", error);
    throw error;
  }
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
