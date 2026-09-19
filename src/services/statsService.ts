import { Campaign, Customer, Assignment, CallRecord, User } from '../types';

export interface CampaignStats {
  totalCustomers: number;
  contacted: number;
  notContacted: number;
  cannotContact: number;
  callbacks: number;
  progressPercent: number;
  isExpired: boolean;
}

export interface StaffProgressStat {
  staff: User;
  assignedCount: number;
  contactedCount: number;
  notContactedCount: number;
  cannotContactCount: number;
  callbackCount: number;
  progressPercent: number;
}

export function computeCampaignStats(
  campaign: Campaign,
  customers: Customer[],
  callRecords: CallRecord[]
): CampaignStats {
  const totalCustomers = customers.length;
  if (totalCustomers === 0) {
    return {
      totalCustomers: 0,
      contacted: 0,
      notContacted: 0,
      cannotContact: 0,
      callbacks: 0,
      progressPercent: 0,
      isExpired: checkIfExpired(campaign.endDate),
    };
  }

  // Map of customerId to latest callRecord
  const recordMap = new Map<string, CallRecord>();
  callRecords.forEach((r) => {
    recordMap.set(r.customerId, r);
  });

  let contacted = 0;
  let cannotContact = 0;
  let notContacted = 0;
  let callbacks = 0;

  customers.forEach((c) => {
    const record = recordMap.get(c.id);
    const status = record?.status || 'not_contacted';

    if (status === 'contacted') {
      contacted++;
      if (record?.result === 'callback_requested' || record?.followUpDate) {
        callbacks++;
      }
    } else if (status === 'cannot_contact') {
      cannotContact++;
    } else {
      notContacted++;
    }
  });

  // Progress formula as specified: (Đã liên hệ + Không liên hệ được) / Tổng số KH * 100
  const completedWork = contacted + cannotContact;
  const progressPercent = totalCustomers > 0 ? Math.round((completedWork / totalCustomers) * 100) : 0;

  return {
    totalCustomers,
    contacted,
    notContacted,
    cannotContact,
    callbacks,
    progressPercent,
    isExpired: checkIfExpired(campaign.endDate),
  };
}

export function computeStaffProgress(
  campaignId: string,
  staffList: User[],
  customers: Customer[],
  assignments: Assignment[],
  callRecords: CallRecord[]
): StaffProgressStat[] {
  const customerMap = new Map<string, Customer>();
  customers.forEach((c) => customerMap.set(c.id, c));

  const recordMap = new Map<string, CallRecord>();
  callRecords.forEach((r) => recordMap.set(r.customerId, r));

  // Staff to assigned customer IDs
  const staffAssignments = new Map<string, string[]>();
  assignments.forEach((a) => {
    if (a.campaignId === campaignId) {
      const list = staffAssignments.get(a.staffId) || [];
      list.push(a.customerId);
      staffAssignments.set(a.staffId, list);
    }
  });

  return staffList.map((staff) => {
    const assignedIds = staffAssignments.get(staff.id) || [];
    const assignedCount = assignedIds.length;

    let contactedCount = 0;
    let cannotContactCount = 0;
    let notContactedCount = 0;
    let callbackCount = 0;

    assignedIds.forEach((cid) => {
      const record = recordMap.get(cid);
      const status = record?.status || 'not_contacted';

      if (status === 'contacted') {
        contactedCount++;
        if (record?.result === 'callback_requested' || record?.followUpDate) {
          callbackCount++;
        }
      } else if (status === 'cannot_contact') {
        cannotContactCount++;
      } else {
        notContactedCount++;
      }
    });

    const completed = contactedCount + cannotContactCount;
    const progressPercent = assignedCount > 0 ? Math.round((completed / assignedCount) * 100) : 0;

    return {
      staff,
      assignedCount,
      contactedCount,
      notContactedCount,
      cannotContactCount,
      callbackCount,
      progressPercent,
    };
  });
}

export function checkIfExpired(endDateStr: string): boolean {
  if (!endDateStr) return false;
  const today = new Date().toISOString().slice(0, 10);
  return endDateStr < today;
}
