# ADR0083 — Real Estate Enquiry Forms placement

RealEstate owns optionalnullable deal_enquiry.form_id in existing JSON. Common publishedEN
reference serves4locales; ENdraftSave staysprivate and ENPublish leaves targetcopy intact.
Selector follows Note. Header/About/Guest independent; null/invalid keeps staticoldform
without wiring the unusedlegacyDealEnquiryForm. EnquirySplit's anchor/intro/contactcolumn
remain. ConfiguredForm ownsfields/submit/messages/consent; oldPageSubmitLabel+Note apply
only to legacyform, explainedbyselectorhelp. No nestedforms and no schemaDDL/backfill.

Explicitstaffpreviewoverride uses ENworkingselection onalltabs, freshsaveddefinition/inertbody.
Publicreader uses onlypublishedEN and DTO withoutprivateconfig. Reuse server-only composition
contracts fromADR0081/82, sameCAS/template/EN-first locks and HEADER_CONTACT_LOCK withseparate
READCOMMITTED lock/mutation statements/freshsnapshot. Archive checksENdraft ORpublished plus
all3previousplacements; no independenttargetusage. TextUUIDcomparisons case-insensitive.

ConfiguredRealEstate captures existing leadcategory deal_enquiry with fixedsource_page
real-estate-enquiry, irrespectiveFormtemplate. Trustedcapture deriveskind only from this
verifiedplacement; the3previousorigins staycontact. Duplicate checks includeexpectedkind,
source andexistinghash/revision identity; all3oldhashes/retries retained. No clientkind or
recipient control. Sameglobaldurablerates, attachmentslimits, atomicfields/history/consent
andwinner-onlynotification. No newrate namespaces or persistedattachmentbytes/publicassets.

PublishEN invalidates common tag+4real-estate paths. FormsSave/Approve invalidatesmodels and
allusedplacements without PagePublish. Resendconsole/unconfigured; realmail/receivingfiles
remain separatelypending. No mainfixtures, remoteDB/R2writes, push/deploy orrolecleanup.


## Existing unresolved Hero compatibility

First actualSave on the clone exposed a preexisting orphanhero UUID in the authored
RealEstate source. Publicalready uses itsstockfallback while strictfull-pagemediavalidation
blocked evenunrelated Enquiry edits. Preserve that reference without datarepair/backfill:
only RealEstate andonly anunchanged validUUID matching the SERVER-READ publishedsnapshot
may retain its existingunresolved Hero fallback onSave/Publish. The draft cannotauthorize
itself; withoutpublishedbaseline thereisnoexception. New/changedmissingrefs, malformedUUIDs,
resolvedunsupportedMIME (includinguppercase lookup), othermedia/OG andotherpages remainstrict.
This narrowPages-onlycompatibility keepsusercontent/publicappearance andenablethe requested
Formassignment; no mediaassetcreation, originalreferenceclear orweakeningofnewuploads.
