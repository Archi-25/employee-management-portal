#!/usr/bin/env bash
P=0; F=0
c() { local l="$1" pat="$2" path="${3:-src/app}"
  if grep -rqE "$pat" $path 2>/dev/null; then printf "  ✅ %s\n" "$l"; P=$((P+1))
  else printf "  ❌ %s\n" "$l"; F=$((F+1)); fi; }

echo "1. LOGIN"
c "Email + password form"        "formControlName=\"password\""
c "Form validation"              "Validators.email"
c "Show/hide password"           "showPassword"
c "Remember me (persists)"       "remember"
c "Logout"                       "signOut|logout\(\)"

echo "2. DASHBOARD"
c "Summary cards"                "app-stat-tile"
c "Total / Active / On leave"    "On leave today"
c "New employees"                "recentJoiners"
c "Department distribution"      "app-bar-chart"
c "Recent employees"             "Recent employees"
c "Recent activity"              "Recent activity"
c "Upcoming birthdays"           "Upcoming birthdays"

echo "3. EMPLOYEE LIST"
c "Table"                        "<table class=\"grid\">"
c "Search"                       "onSearch"
c "Filters (dept/status/type/desig)" "onEmploymentType"
c "Sort"                         "sortBy\("
c "Pagination"                   "totalPages"
c "Status badges"                "statusClass"
c "View / Edit / Delete actions" "askToDelete"
c "Add employee"                 "Add employee"

echo "4. ADD EMPLOYEE"
c "Personal info section"        "Personal information"
c "Professional info section"    "Professional information"
c "Address section"              "heading=\"Address\""
c "Required validation"          "Validators.required"
c "Email validation"             "Validators.email"
c "Phone validation"             "Validators.pattern"
c "Min/max length"               "Validators.minLength|Validators.maxLength"
c "Date validation"              "adultValidator|notFutureValidator"
c "Error messages"               "class=\"error\""
c "Submit / Cancel / Reset"      "\(click\)=\"reset\(\)\""

echo "5. EMPLOYEE DETAILS"
c "Profile header"               "detail-head"
c "Tabs"                         "role=\"tablist\""
c "Personal tab"                 "'personal'"
c "Professional tab"             "'professional'"
c "Attendance tab"               "'attendance'"
c "Leave tab"                    "@case \('leave'\)"
c "Documents tab"                "'documents'"

echo "6. EDIT EMPLOYEE"
c "Reuses the add form"          "isEdit\(\)"
c "Pre-filled data"              "private patch\("
c "Unsaved-changes guard"        "hasUnsavedChanges"

echo "7. DELETE EMPLOYEE"
c "Confirmation modal"           "app-confirm-dialog"
c "Cancel / Delete buttons"      "confirmLabel"

echo "8. ATTENDANCE"
c "Present/Absent/Late/OnLeave"  "attendanceRate"
c "Attendance table"             "Check in"
c "Date filter"                  "onDate\("
c "Employee search"              "search.set"
c "Status filter"                "onStatus\("

echo "9. LEAVE"
c "Leave balance"                "myBalance"
c "Apply leave"                  "Apply for leave"
c "Leave history"                "leave-page.html"  src/app/features/leave
c "Approve"                      "approve\(request\)"
c "Reject"                       "confirmReject"
c "Pending/Approved/Rejected"    "PENDING.*APPROVED|LeaveStatus"

echo "10. DEPARTMENTS"
c "View departments"             "All departments"
c "Add department"               "Add department"
c "Edit department"              "startEdit"
c "Delete department"            "deleting.set"
c "Employee count"               "countFor"

echo "11. DOCUMENTS"
c "Document name / type"         "DocumentType"
c "Upload"                       "onFile\("
c "View / download"              "download\("
c "Delete"                       "deleteDocument"

echo "12. NOTIFICATIONS"
c "Notification dropdown"        "app-notification-bell"
c "Unread badge"                 "unreadCount"
c "Mark read"                    "markAllRead"

echo "13. PROFILE / SETTINGS"
c "Admin profile"                "Your profile"
c "Change password UI"           "passwordForm"
c "Company information"          "heading=\"Company\""
c "Theme toggle"                 "ThemeService"

echo "14. ROLE-BASED UI"
c "Admin / Manager / Employee"   "ROLES"
c "Role directive"               "appHasRole"
c "Route guards"                 "roleGuard"
c "Server-side enforcement"      "Only administrators may delete"

echo
printf "  PASS: %d   FAIL: %d\n" "$P" "$F"
