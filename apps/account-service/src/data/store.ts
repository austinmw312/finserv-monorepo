import { Account, AccountStatus, KYCStatus } from "@finserv/common";

class AccountStore {
  private accounts: Map<string, Account> = new Map();

  constructor() {
    this.seed();
  }

  private seed(): void {
    const seedAccounts: Account[] = [
      {
        id: "acc-001",
        userId: "usr-001",
        email: "john.doe@example.com",
        name: "John Doe",
        balance: 50000,
        currency: "USD",
        status: AccountStatus.ACTIVE,
        kycStatus: KYCStatus.APPROVED,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-06-01"),
      },
      {
        id: "acc-002",
        userId: "usr-002",
        email: "jane.smith@example.com",
        name: "Jane Smith",
        balance: 125000,
        currency: "USD",
        status: AccountStatus.ACTIVE,
        kycStatus: KYCStatus.APPROVED,
        createdAt: new Date("2024-02-20"),
        updatedAt: new Date("2024-05-15"),
      },
      {
        id: "acc-003",
        userId: "usr-003",
        email: "bob.wilson@example.com",
        name: "Bob Wilson",
        balance: 5000,
        currency: "USD",
        status: AccountStatus.ACTIVE,
        kycStatus: KYCStatus.PENDING,
        createdAt: new Date("2024-11-01"),
        updatedAt: new Date("2024-11-01"),
      },
      {
        id: "acc-004",
        userId: "usr-004",
        email: "alice.chen@example.com",
        name: "Alice Chen",
        balance: 0,
        currency: "USD",
        status: AccountStatus.SUSPENDED,
        kycStatus: KYCStatus.REJECTED,
        createdAt: new Date("2024-03-10"),
        updatedAt: new Date("2024-08-22"),
      },
    ];

    for (const account of seedAccounts) {
      this.accounts.set(account.id, account);
    }
  }

  getAll(): Account[] {
    return Array.from(this.accounts.values());
  }

  getById(id: string): Account | undefined {
    return this.accounts.get(id);
  }

  getByEmail(email: string): Account | undefined {
    return Array.from(this.accounts.values()).find((a) => a.email === email);
  }

  create(account: Account): void {
    this.accounts.set(account.id, account);
  }

  update(account: Account): void {
    this.accounts.set(account.id, account);
  }

  delete(id: string): boolean {
    return this.accounts.delete(id);
  }
}

export const accountStore = new AccountStore();
