2025-11-02T09:09:55.000000000Z [inf]  Starting Container
2025-11-02T09:09:55.872342699Z [inf]  ⏭️  Skipping add_performance_monitoring.sql (already applied)
2025-11-02T09:09:55.872355133Z [inf]  ⏭️  Skipping add_user_activity_log.sql (already applied)
2025-11-02T09:09:55.872370855Z [inf]  
2025-11-02T09:09:55.872376639Z [inf]  > mellchat-api@1.0.0 start:with-migrations
2025-11-02T09:09:55.872381243Z [inf]  > NODE_ENV=production sh -c 'node apply-migrations.js && node src/index.js' || node src/index.js
2025-11-02T09:09:55.872389914Z [inf]  
2025-11-02T09:09:55.872394616Z [inf]  ✅ Connected to database on attempt 1
2025-11-02T09:09:55.872403392Z [inf]  ✅ Migrations tracking table ready
2025-11-02T09:09:55.872408791Z [inf]  📂 Migrations directory: /app/database/migrations
2025-11-02T09:09:55.872417729Z [inf]  📝 Found 20 migration files
2025-11-02T09:09:55.872424499Z [inf]  ⏭️  Skipping 01_initial_schema.sql (already applied)
2025-11-02T09:09:55.872431191Z [inf]  ⏭️  Skipping add_guest_sessions.sql (already applied)
2025-11-02T09:09:55.872438548Z [inf]  ⏭️  Skipping add_fingerprint_to_guest_sessions.sql (already applied)
2025-11-02T09:09:55.872446753Z [inf]  ⏭️  Skipping add_auth_users.sql (already applied)
2025-11-02T09:09:55.872452384Z [inf]  ⏭️  Skipping add_auth_tables.sql (already applied)
2025-11-02T09:09:55.872458104Z [inf]  ⏭️  Skipping add_message_scoring_fields.sql (already applied)
2025-11-02T09:09:55.872467298Z [inf]  ⏭️  Skipping add_moderation_fields.sql (already applied)
2025-11-02T09:09:55.872473602Z [inf]  ⏭️  Skipping add_materialized_views.sql (already applied)
2025-11-02T09:09:55.872480425Z [inf]  ⏭️  Skipping add_advanced_indexes.sql (already applied)
2025-11-02T09:09:55.872487317Z [inf]  ⏭️  Skipping add_critical_indexes.sql (already applied)
2025-11-02T09:09:55.872491856Z [inf]  ⏭️  Skipping add_global_rules.sql (already applied)
2025-11-02T09:09:55.875099805Z [inf]  ⏭️  Skipping add_user_global_rules.sql (already applied)
2025-11-02T09:09:55.877171952Z [inf]  ⏭️  Skipping add_user_sessions.sql (already applied)
2025-11-02T09:09:55.877176499Z [inf]  ⏭️  Skipping add_user_settings.sql (already applied)
2025-11-02T09:09:55.877921814Z [inf]  ⏭️  Skipping add_user_spam_rules.sql (already applied)
2025-11-02T09:09:55.879455968Z [inf]  ⏭️  Skipping fix_schema_critical.sql (already applied)
2025-11-02T09:09:55.879463906Z [inf]  ⏭️  Skipping fix_user_id.sql (already applied)
2025-11-02T09:09:55.881161935Z [inf]  ⏭️  Skipping optimize_data_types.sql (already applied)
2025-11-02T09:09:55.881170302Z [inf]  
2025-11-02T09:09:55.881176942Z [inf]  🎉 Migrations completed!
2025-11-02T09:09:55.881182772Z [inf]     ✅ Applied: 0
2025-11-02T09:09:55.881189945Z [inf]     ⏭️  Skipped: 20
2025-11-02T09:09:56.342101161Z [inf]  2025-11-02 09:09:56.333 [[32minfo[39m] ✅ Rate limiter initialized {
2025-11-02T09:09:56.342108652Z [inf]    "service": "mellchat-api",
2025-11-02T09:09:56.342113638Z [inf]    "version": "1.0.0"
2025-11-02T09:09:56.342117535Z [inf]  }
2025-11-02T09:09:56.387933454Z [inf]  2025-11-02 09:09:56.379 [[32minfo[39m] ✅ Metrics initialized {
2025-11-02T09:09:56.387939223Z [inf]    "service": "mellchat-api",
2025-11-02T09:09:56.387943632Z [inf]    "version": "1.0.0"
2025-11-02T09:09:56.387947989Z [inf]  }
2025-11-02T09:09:56.885437533Z [inf]  2025-11-02 09:09:56.861 [[32minfo[39m] ✅ Rate limiter initialized {
2025-11-02T09:09:56.885448122Z [inf]    "service": "mellchat-api",
2025-11-02T09:09:56.885453976Z [inf]    "version": "1.0.0"
2025-11-02T09:09:56.885458882Z [inf]  }
2025-11-02T09:09:56.898573872Z [inf]  2025-11-02 09:09:56.895 [[32minfo[39m] ✅ Metrics initialized {
2025-11-02T09:09:56.898580541Z [inf]    "service": "mellchat-api",
2025-11-02T09:09:56.898585278Z [inf]    "version": "1.0.0"
2025-11-02T09:09:56.898589673Z [inf]  }
2025-11-02T09:09:56.918075596Z [inf]  2025-11-02 09:09:56.913 [[32minfo[39m] Redis client connected for rate limiting {
2025-11-02T09:09:56.918081809Z [inf]    "service": "mellchat-api",
2025-11-02T09:09:56.918087016Z [inf]    "version": "1.0.0"
2025-11-02T09:09:56.918091395Z [inf]  }
2025-11-02T09:09:56.932731282Z [err]  npm notice To update run: npm install -g npm@11.6.2
2025-11-02T09:09:56.932738763Z [err]  npm notice
2025-11-02T09:09:56.932750477Z [err]  npm notice New major version of npm available! 10.8.2 -> 11.6.2
2025-11-02T09:09:56.932751994Z [err]  npm notice
2025-11-02T09:09:56.932760860Z [err]  npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.6.2
2025-11-02T09:09:58.269925891Z [inf]  
2025-11-02T09:09:58.269932458Z [inf]  > mellchat-api@1.0.0 start:with-migrations
2025-11-02T09:09:58.269946523Z [inf]  > NODE_ENV=production sh -c 'node apply-migrations.js && node src/index.js' || node src/index.js
2025-11-02T09:09:58.269952798Z [inf]  
2025-11-02T09:09:58.815761600Z [inf]  ⏭️  Skipping add_user_spam_rules.sql (already applied)
2025-11-02T09:09:58.815776384Z [inf]  ⏭️  Skipping add_guest_sessions.sql (already applied)
2025-11-02T09:09:58.815781873Z [inf]  ⏭️  Skipping add_fingerprint_to_guest_sessions.sql (already applied)
2025-11-02T09:09:58.815787436Z [inf]  ⏭️  Skipping add_auth_users.sql (already applied)
2025-11-02T09:09:58.815793089Z [inf]  ⏭️  Skipping add_auth_tables.sql (already applied)
2025-11-02T09:09:58.815796352Z [inf]  📂 Migrations directory: /app/database/migrations
2025-11-02T09:09:58.815798907Z [inf]  ⏭️  Skipping add_message_scoring_fields.sql (already applied)
2025-11-02T09:09:58.815805192Z [inf]  ⏭️  Skipping add_moderation_fields.sql (already applied)
2025-11-02T09:09:58.815812374Z [inf]  📝 Found 20 migration files
2025-11-02T09:09:58.815814412Z [inf]  ⏭️  Skipping add_materialized_views.sql (already applied)
2025-11-02T09:09:58.815820309Z [inf]  ⏭️  Skipping add_advanced_indexes.sql (already applied)
2025-11-02T09:09:58.815824170Z [inf]  ⏭️  Skipping 01_initial_schema.sql (already applied)
2025-11-02T09:09:58.815826423Z [inf]  ⏭️  Skipping add_critical_indexes.sql (already applied)
2025-11-02T09:09:58.815831255Z [inf]  ⏭️  Skipping add_global_rules.sql (already applied)
2025-11-02T09:09:58.815835890Z [inf]  ⏭️  Skipping add_performance_monitoring.sql (already applied)
2025-11-02T09:09:58.815842865Z [inf]  ⏭️  Skipping add_user_activity_log.sql (already applied)
2025-11-02T09:09:58.815849186Z [inf]  ⏭️  Skipping add_user_global_rules.sql (already applied)
2025-11-02T09:09:58.815854939Z [inf]  ⏭️  Skipping add_user_sessions.sql (already applied)
2025-11-02T09:09:58.815860451Z [inf]  ⏭️  Skipping add_user_settings.sql (already applied)
2025-11-02T09:09:58.815880141Z [inf]  ✅ Connected to database on attempt 1
2025-11-02T09:09:58.815888141Z [inf]  ✅ Migrations tracking table ready
2025-11-02T09:09:58.817384485Z [inf]  ⏭️  Skipping fix_schema_critical.sql (already applied)
2025-11-02T09:09:58.817390330Z [inf]  ⏭️  Skipping fix_user_id.sql (already applied)
2025-11-02T09:09:58.817396379Z [inf]  ⏭️  Skipping optimize_data_types.sql (already applied)
2025-11-02T09:09:58.817404382Z [inf]  
2025-11-02T09:09:58.817412290Z [inf]  🎉 Migrations completed!
2025-11-02T09:09:58.817418702Z [inf]     ✅ Applied: 0
2025-11-02T09:09:58.817425885Z [inf]     ⏭️  Skipped: 20
2025-11-02T09:09:59.382777115Z [inf]  2025-11-02 09:09:59.012 [[32minfo[39m] ✅ Rate limiter initialized {
2025-11-02T09:09:59.382781635Z [inf]    "service": "mellchat-api",
2025-11-02T09:09:59.382789397Z [inf]    "version": "1.0.0"
2025-11-02T09:09:59.382794346Z [inf]  }
2025-11-02T09:09:59.382884142Z [inf]  2025-11-02 09:09:59.050 [[32minfo[39m] ✅ Metrics initialized {
2025-11-02T09:09:59.382889129Z [inf]    "service": "mellchat-api",
2025-11-02T09:09:59.382893023Z [inf]    "version": "1.0.0"
2025-11-02T09:09:59.382897401Z [inf]  }
2025-11-02T09:09:59.879747061Z [inf]  2025-11-02 09:09:59.577 [[32minfo[39m] ✅ Rate limiter initialized {
2025-11-02T09:09:59.879752905Z [inf]    "service": "mellchat-api",
2025-11-02T09:09:59.879759634Z [inf]    "version": "1.0.0"
2025-11-02T09:09:59.879767288Z [inf]  }
2025-11-02T09:09:59.879774907Z [inf]  2025-11-02 09:09:59.620 [[32minfo[39m] ✅ Metrics initialized {
2025-11-02T09:09:59.879780985Z [inf]    "service": "mellchat-api",
2025-11-02T09:09:59.879787726Z [inf]    "version": "1.0.0"
2025-11-02T09:09:59.879794464Z [inf]  }
2025-11-02T09:09:59.879804850Z [inf]  2025-11-02 09:09:59.639 [[32minfo[39m] Redis client connected for rate limiting {
2025-11-02T09:09:59.879810835Z [inf]    "service": "mellchat-api",
2025-11-02T09:09:59.879817856Z [inf]    "version": "1.0.0"
2025-11-02T09:09:59.879824168Z [inf]  }
2025-11-02T09:10:02.405322617Z [inf]  
2025-11-02T09:10:02.405329387Z [inf]  > mellchat-api@1.0.0 start:with-migrations
2025-11-02T09:10:02.405335159Z [inf]  > NODE_ENV=production sh -c 'node apply-migrations.js && node src/index.js' || node src/index.js
2025-11-02T09:10:02.405340549Z [inf]  
2025-11-02T09:10:02.890441896Z [inf]  ⏭️  Skipping add_user_spam_rules.sql (already applied)
2025-11-02T09:10:02.890470230Z [inf]  ⏭️  Skipping add_moderation_fields.sql (already applied)
2025-11-02T09:10:02.890483786Z [inf]  ⏭️  Skipping add_materialized_views.sql (already applied)
2025-11-02T09:10:02.890490756Z [inf]  ⏭️  Skipping add_advanced_indexes.sql (already applied)
2025-11-02T09:10:02.890498686Z [inf]  ⏭️  Skipping add_critical_indexes.sql (already applied)
2025-11-02T09:10:02.890504766Z [inf]  ⏭️  Skipping add_global_rules.sql (already applied)
2025-11-02T09:10:02.890511916Z [inf]  ⏭️  Skipping add_performance_monitoring.sql (already applied)
2025-11-02T09:10:02.890517790Z [inf]  ⏭️  Skipping add_user_activity_log.sql (already applied)
2025-11-02T09:10:02.890524116Z [inf]  ⏭️  Skipping add_user_global_rules.sql (already applied)
2025-11-02T09:10:02.890530703Z [inf]  ⏭️  Skipping add_user_sessions.sql (already applied)
2025-11-02T09:10:02.890538259Z [inf]  ⏭️  Skipping add_user_settings.sql (already applied)
2025-11-02T09:10:02.890573933Z [inf]  ✅ Connected to database on attempt 1
2025-11-02T09:10:02.890578930Z [inf]  ✅ Migrations tracking table ready
2025-11-02T09:10:02.890584484Z [inf]  📂 Migrations directory: /app/database/migrations
2025-11-02T09:10:02.890588840Z [inf]  📝 Found 20 migration files
2025-11-02T09:10:02.890593672Z [inf]  ⏭️  Skipping 01_initial_schema.sql (already applied)
2025-11-02T09:10:02.890598774Z [inf]  ⏭️  Skipping add_guest_sessions.sql (already applied)
2025-11-02T09:10:02.890604565Z [inf]  ⏭️  Skipping add_fingerprint_to_guest_sessions.sql (already applied)
2025-11-02T09:10:02.890610633Z [inf]  ⏭️  Skipping add_auth_users.sql (already applied)
2025-11-02T09:10:02.890624327Z [inf]  ⏭️  Skipping add_auth_tables.sql (already applied)
2025-11-02T09:10:02.890631010Z [inf]  ⏭️  Skipping add_message_scoring_fields.sql (already applied)
2025-11-02T09:10:02.893231475Z [inf]  ⏭️  Skipping fix_schema_critical.sql (already applied)
2025-11-02T09:10:02.893237262Z [inf]  ⏭️  Skipping fix_user_id.sql (already applied)
2025-11-02T09:10:02.893242604Z [inf]  ⏭️  Skipping optimize_data_types.sql (already applied)
2025-11-02T09:10:02.893249012Z [inf]  
2025-11-02T09:10:02.893254499Z [inf]  🎉 Migrations completed!
2025-11-02T09:10:02.893259231Z [inf]     ✅ Applied: 0
2025-11-02T09:10:02.893263533Z [inf]     ⏭️  Skipped: 20
2025-11-02T09:10:03.130707023Z [inf]  2025-11-02 09:10:03.116 [[32minfo[39m] ✅ Rate limiter initialized {
2025-11-02T09:10:03.130713132Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:03.130719118Z [inf]    "version": "1.0.0"
2025-11-02T09:10:03.130724264Z [inf]  }
2025-11-02T09:10:03.166599373Z [inf]  2025-11-02 09:10:03.160 [[32minfo[39m] ✅ Metrics initialized {
2025-11-02T09:10:03.166606256Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:03.166610784Z [inf]    "version": "1.0.0"
2025-11-02T09:10:03.166615109Z [inf]  }
2025-11-02T09:10:03.845789358Z [inf]    "version": "1.0.0"
2025-11-02T09:10:03.845798564Z [inf]  }
2025-11-02T09:10:03.845812836Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:03.845818355Z [inf]    "version": "1.0.0"
2025-11-02T09:10:03.845823793Z [inf]  }
2025-11-02T09:10:03.845829533Z [inf]  2025-11-02 09:10:03.733 [[32minfo[39m] Redis client connected for rate limiting {
2025-11-02T09:10:03.845835198Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:03.845840496Z [inf]  2025-11-02 09:10:03.680 [[32minfo[39m] ✅ Rate limiter initialized {
2025-11-02T09:10:03.845848067Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:03.845855211Z [inf]    "version": "1.0.0"
2025-11-02T09:10:03.845862539Z [inf]  }
2025-11-02T09:10:03.845869975Z [inf]  2025-11-02 09:10:03.717 [[32minfo[39m] ✅ Metrics initialized {
2025-11-02T09:10:06.418555067Z [inf]  
2025-11-02T09:10:06.418564777Z [inf]  > mellchat-api@1.0.0 start:with-migrations
2025-11-02T09:10:06.418571411Z [inf]  > NODE_ENV=production sh -c 'node apply-migrations.js && node src/index.js' || node src/index.js
2025-11-02T09:10:06.418576216Z [inf]  
2025-11-02T09:10:06.844086002Z [inf]  ⏭️  Skipping add_fingerprint_to_guest_sessions.sql (already applied)
2025-11-02T09:10:06.844092014Z [inf]  ⏭️  Skipping add_auth_users.sql (already applied)
2025-11-02T09:10:06.844098089Z [inf]  ✅ Connected to database on attempt 1
2025-11-02T09:10:06.844102854Z [inf]  ⏭️  Skipping add_advanced_indexes.sql (already applied)
2025-11-02T09:10:06.844108043Z [inf]  ✅ Migrations tracking table ready
2025-11-02T09:10:06.844108155Z [inf]  ⏭️  Skipping add_user_sessions.sql (already applied)
2025-11-02T09:10:06.844115798Z [inf]  📂 Migrations directory: /app/database/migrations
2025-11-02T09:10:06.844115996Z [inf]  ⏭️  Skipping add_auth_tables.sql (already applied)
2025-11-02T09:10:06.844118675Z [inf]  ⏭️  Skipping add_user_activity_log.sql (already applied)
2025-11-02T09:10:06.844120498Z [inf]  ⏭️  Skipping add_user_settings.sql (already applied)
2025-11-02T09:10:06.844125189Z [inf]  ⏭️  Skipping add_message_scoring_fields.sql (already applied)
2025-11-02T09:10:06.844127537Z [inf]  ⏭️  Skipping add_user_spam_rules.sql (already applied)
2025-11-02T09:10:06.844129279Z [inf]  ⏭️  Skipping add_user_global_rules.sql (already applied)
2025-11-02T09:10:06.844129776Z [inf]  📝 Found 20 migration files
2025-11-02T09:10:06.844138611Z [inf]  ⏭️  Skipping 01_initial_schema.sql (already applied)
2025-11-02T09:10:06.844144283Z [inf]  ⏭️  Skipping add_guest_sessions.sql (already applied)
2025-11-02T09:10:06.844170739Z [inf]  ⏭️  Skipping add_critical_indexes.sql (already applied)
2025-11-02T09:10:06.844176673Z [inf]  ⏭️  Skipping add_moderation_fields.sql (already applied)
2025-11-02T09:10:06.844177083Z [inf]  ⏭️  Skipping add_global_rules.sql (already applied)
2025-11-02T09:10:06.844181670Z [inf]  ⏭️  Skipping add_performance_monitoring.sql (already applied)
2025-11-02T09:10:06.844200855Z [inf]  ⏭️  Skipping add_materialized_views.sql (already applied)
2025-11-02T09:10:06.845717957Z [inf]  ⏭️  Skipping fix_schema_critical.sql (already applied)
2025-11-02T09:10:06.845723270Z [inf]  ⏭️  Skipping fix_user_id.sql (already applied)
2025-11-02T09:10:06.845728306Z [inf]  ⏭️  Skipping optimize_data_types.sql (already applied)
2025-11-02T09:10:06.845734109Z [inf]  
2025-11-02T09:10:06.845744303Z [inf]  🎉 Migrations completed!
2025-11-02T09:10:06.845749748Z [inf]     ✅ Applied: 0
2025-11-02T09:10:06.845761509Z [inf]     ⏭️  Skipped: 20
2025-11-02T09:10:07.140934549Z [inf]  2025-11-02 09:10:07.134 [[32minfo[39m] ✅ Rate limiter initialized {
2025-11-02T09:10:07.140941033Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:07.140945335Z [inf]    "version": "1.0.0"
2025-11-02T09:10:07.140949725Z [inf]  }
2025-11-02T09:10:07.189434513Z [inf]  2025-11-02 09:10:07.173 [[32minfo[39m] ✅ Metrics initialized {
2025-11-02T09:10:07.189441636Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:07.189448560Z [inf]    "version": "1.0.0"
2025-11-02T09:10:07.189453589Z [inf]  }
2025-11-02T09:10:07.831195474Z [inf]  2025-11-02 09:10:07.638 [[32minfo[39m] ✅ Rate limiter initialized {
2025-11-02T09:10:07.831202726Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:07.831209156Z [inf]    "version": "1.0.0"
2025-11-02T09:10:07.831216514Z [inf]  }
2025-11-02T09:10:07.831223146Z [inf]  2025-11-02 09:10:07.681 [[32minfo[39m] ✅ Metrics initialized {
2025-11-02T09:10:07.831229030Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:07.831234543Z [inf]    "version": "1.0.0"
2025-11-02T09:10:07.831239513Z [inf]  }
2025-11-02T09:10:07.831245933Z [inf]  2025-11-02 09:10:07.698 [[32minfo[39m] Redis client connected for rate limiting {
2025-11-02T09:10:07.831252020Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:07.831259387Z [inf]    "version": "1.0.0"
2025-11-02T09:10:07.831265146Z [inf]  }
2025-11-02T09:10:09.242455808Z [inf]  
2025-11-02T09:10:09.242461034Z [inf]  > mellchat-api@1.0.0 start:with-migrations
2025-11-02T09:10:09.242467474Z [inf]  > NODE_ENV=production sh -c 'node apply-migrations.js && node src/index.js' || node src/index.js
2025-11-02T09:10:09.242472112Z [inf]  
2025-11-02T09:10:09.903500880Z [inf]  ⏭️  Skipping add_user_settings.sql (already applied)
2025-11-02T09:10:09.903512262Z [inf]  ⏭️  Skipping add_user_spam_rules.sql (already applied)
2025-11-02T09:10:09.903537135Z [inf]  ✅ Connected to database on attempt 1
2025-11-02T09:10:09.903546669Z [inf]  ✅ Migrations tracking table ready
2025-11-02T09:10:09.903553685Z [inf]  📂 Migrations directory: /app/database/migrations
2025-11-02T09:10:09.903557409Z [inf]  ⏭️  Skipping add_materialized_views.sql (already applied)
2025-11-02T09:10:09.903560795Z [inf]  📝 Found 20 migration files
2025-11-02T09:10:09.903568248Z [inf]  ⏭️  Skipping 01_initial_schema.sql (already applied)
2025-11-02T09:10:09.903573214Z [inf]  ⏭️  Skipping add_advanced_indexes.sql (already applied)
2025-11-02T09:10:09.903575381Z [inf]  ⏭️  Skipping add_guest_sessions.sql (already applied)
2025-11-02T09:10:09.903580947Z [inf]  ⏭️  Skipping add_fingerprint_to_guest_sessions.sql (already applied)
2025-11-02T09:10:09.903582752Z [inf]  ⏭️  Skipping add_critical_indexes.sql (already applied)
2025-11-02T09:10:09.903586258Z [inf]  ⏭️  Skipping add_auth_users.sql (already applied)
2025-11-02T09:10:09.903593364Z [inf]  ⏭️  Skipping add_global_rules.sql (already applied)
2025-11-02T09:10:09.903593829Z [inf]  ⏭️  Skipping add_auth_tables.sql (already applied)
2025-11-02T09:10:09.903599235Z [inf]  ⏭️  Skipping add_message_scoring_fields.sql (already applied)
2025-11-02T09:10:09.903603270Z [inf]  ⏭️  Skipping add_performance_monitoring.sql (already applied)
2025-11-02T09:10:09.903605020Z [inf]  ⏭️  Skipping add_moderation_fields.sql (already applied)
2025-11-02T09:10:09.903612390Z [inf]  ⏭️  Skipping add_user_activity_log.sql (already applied)
2025-11-02T09:10:09.903619057Z [inf]  ⏭️  Skipping add_user_global_rules.sql (already applied)
2025-11-02T09:10:09.903626119Z [inf]  ⏭️  Skipping add_user_sessions.sql (already applied)
2025-11-02T09:10:09.904202015Z [inf]  ⏭️  Skipping fix_schema_critical.sql (already applied)
2025-11-02T09:10:09.904206020Z [inf]  ⏭️  Skipping fix_user_id.sql (already applied)
2025-11-02T09:10:09.904210299Z [inf]  ⏭️  Skipping optimize_data_types.sql (already applied)
2025-11-02T09:10:09.904215929Z [inf]  
2025-11-02T09:10:09.904220869Z [inf]  🎉 Migrations completed!
2025-11-02T09:10:09.904228601Z [inf]     ✅ Applied: 0
2025-11-02T09:10:09.904233292Z [inf]     ⏭️  Skipped: 20
2025-11-02T09:10:10.063931848Z [inf]  2025-11-02 09:10:10.051 [[32minfo[39m] ✅ Rate limiter initialized {
2025-11-02T09:10:10.063948348Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:10.063955843Z [inf]    "version": "1.0.0"
2025-11-02T09:10:10.063962867Z [inf]  }
2025-11-02T09:10:10.105450920Z [inf]  2025-11-02 09:10:10.099 [[32minfo[39m] ✅ Metrics initialized {
2025-11-02T09:10:10.105457355Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:10.105463471Z [inf]    "version": "1.0.0"
2025-11-02T09:10:10.105469363Z [inf]  }
2025-11-02T09:10:10.877609495Z [inf]    "version": "1.0.0"
2025-11-02T09:10:10.877616968Z [inf]    "version": "1.0.0"
2025-11-02T09:10:10.877620001Z [inf]  }
2025-11-02T09:10:10.877627538Z [inf]  2025-11-02 09:10:10.715 [[32minfo[39m] ✅ Metrics initialized {
2025-11-02T09:10:10.877635556Z [inf]  }
2025-11-02T09:10:10.877639735Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:10.877648514Z [inf]    "version": "1.0.0"
2025-11-02T09:10:10.877655348Z [inf]  }
2025-11-02T09:10:10.877661729Z [inf]  2025-11-02 09:10:10.738 [[32minfo[39m] Redis client connected for rate limiting {
2025-11-02T09:10:10.877668452Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:10.877757043Z [inf]  2025-11-02 09:10:10.669 [[32minfo[39m] ✅ Rate limiter initialized {
2025-11-02T09:10:10.877764349Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:11.961027464Z [inf]  
2025-11-02T09:10:11.961033860Z [inf]  > mellchat-api@1.0.0 start:with-migrations
2025-11-02T09:10:11.961042582Z [inf]  > NODE_ENV=production sh -c 'node apply-migrations.js && node src/index.js' || node src/index.js
2025-11-02T09:10:11.961047996Z [inf]  
2025-11-02T09:10:12.224436531Z [inf]  ✅ Connected to database on attempt 1
2025-11-02T09:10:12.224446735Z [inf]  ✅ Migrations tracking table ready
2025-11-02T09:10:12.224450974Z [inf]  📂 Migrations directory: /app/database/migrations
2025-11-02T09:10:12.233800958Z [inf]  📝 Found 20 migration files
2025-11-02T09:10:12.241469961Z [inf]  ⏭️  Skipping 01_initial_schema.sql (already applied)
2025-11-02T09:10:12.241478799Z [inf]  ⏭️  Skipping add_guest_sessions.sql (already applied)
2025-11-02T09:10:12.241488580Z [inf]  ⏭️  Skipping add_fingerprint_to_guest_sessions.sql (already applied)
2025-11-02T09:10:12.241495982Z [inf]  ⏭️  Skipping add_auth_users.sql (already applied)
2025-11-02T09:10:12.243514928Z [inf]  ⏭️  Skipping add_auth_tables.sql (already applied)
2025-11-02T09:10:12.243520837Z [inf]  ⏭️  Skipping add_message_scoring_fields.sql (already applied)
2025-11-02T09:10:12.245711733Z [inf]  ⏭️  Skipping add_moderation_fields.sql (already applied)
2025-11-02T09:10:12.245718501Z [inf]  ⏭️  Skipping add_materialized_views.sql (already applied)
2025-11-02T09:10:12.247701807Z [inf]  ⏭️  Skipping add_advanced_indexes.sql (already applied)
2025-11-02T09:10:12.247707367Z [inf]  ⏭️  Skipping add_critical_indexes.sql (already applied)
2025-11-02T09:10:12.249642764Z [inf]  ⏭️  Skipping add_global_rules.sql (already applied)
2025-11-02T09:10:12.251593998Z [inf]  ⏭️  Skipping add_performance_monitoring.sql (already applied)
2025-11-02T09:10:12.251598680Z [inf]  ⏭️  Skipping add_user_activity_log.sql (already applied)
2025-11-02T09:10:12.253377743Z [inf]  ⏭️  Skipping add_user_global_rules.sql (already applied)
2025-11-02T09:10:12.253382109Z [inf]  ⏭️  Skipping add_user_sessions.sql (already applied)
2025-11-02T09:10:12.253386458Z [inf]  ⏭️  Skipping add_user_settings.sql (already applied)
2025-11-02T09:10:12.255753899Z [inf]  ⏭️  Skipping add_user_spam_rules.sql (already applied)
2025-11-02T09:10:12.255763115Z [inf]  ⏭️  Skipping fix_schema_critical.sql (already applied)
2025-11-02T09:10:12.255768586Z [inf]  ⏭️  Skipping fix_user_id.sql (already applied)
2025-11-02T09:10:12.257628297Z [inf]  ⏭️  Skipping optimize_data_types.sql (already applied)
2025-11-02T09:10:12.257636678Z [inf]  
2025-11-02T09:10:12.257642440Z [inf]  🎉 Migrations completed!
2025-11-02T09:10:12.257647383Z [inf]     ✅ Applied: 0
2025-11-02T09:10:12.257652132Z [inf]     ⏭️  Skipped: 20
2025-11-02T09:10:13.003920237Z [inf]  }
2025-11-02T09:10:13.003924534Z [inf]    "version": "1.0.0"
2025-11-02T09:10:13.003937201Z [inf]  }
2025-11-02T09:10:13.003946691Z [inf]  2025-11-02 09:10:12.710 [[32minfo[39m] ✅ Metrics initialized {
2025-11-02T09:10:13.003956114Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:13.003966942Z [inf]    "version": "1.0.0"
2025-11-02T09:10:13.003986895Z [inf]  2025-11-02 09:10:12.668 [[32minfo[39m] ✅ Rate limiter initialized {
2025-11-02T09:10:13.003995265Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:13.243649729Z [inf]  2025-11-02 09:10:13.236 [[32minfo[39m] ✅ Rate limiter initialized {
2025-11-02T09:10:13.243654731Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:13.243659153Z [inf]    "version": "1.0.0"
2025-11-02T09:10:13.243664708Z [inf]  }
2025-11-02T09:10:13.286177795Z [inf]  2025-11-02 09:10:13.284 [[32minfo[39m] ✅ Metrics initialized {
2025-11-02T09:10:13.286184485Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:13.286188761Z [inf]    "version": "1.0.0"
2025-11-02T09:10:13.286193278Z [inf]  }
2025-11-02T09:10:13.313170798Z [inf]  2025-11-02 09:10:13.303 [[32minfo[39m] Redis client connected for rate limiting {
2025-11-02T09:10:13.313180950Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:13.313187058Z [inf]    "version": "1.0.0"
2025-11-02T09:10:13.313192243Z [inf]  }
2025-11-02T09:10:14.204438757Z [inf]  
2025-11-02T09:10:14.204450840Z [inf]  > mellchat-api@1.0.0 start:with-migrations
2025-11-02T09:10:14.204464332Z [inf]  > NODE_ENV=production sh -c 'node apply-migrations.js && node src/index.js' || node src/index.js
2025-11-02T09:10:14.204470422Z [inf]  
2025-11-02T09:10:14.486110979Z [inf]  ✅ Connected to database on attempt 1
2025-11-02T09:10:14.486118659Z [inf]  ✅ Migrations tracking table ready
2025-11-02T09:10:14.486125754Z [inf]  📂 Migrations directory: /app/database/migrations
2025-11-02T09:10:14.495283153Z [inf]  📝 Found 20 migration files
2025-11-02T09:10:14.495289682Z [inf]  ⏭️  Skipping 01_initial_schema.sql (already applied)
2025-11-02T09:10:14.495294185Z [inf]  ⏭️  Skipping add_guest_sessions.sql (already applied)
2025-11-02T09:10:14.499973601Z [inf]  ⏭️  Skipping add_fingerprint_to_guest_sessions.sql (already applied)
2025-11-02T09:10:14.499982445Z [inf]  ⏭️  Skipping add_auth_users.sql (already applied)
2025-11-02T09:10:14.500354222Z [inf]  ⏭️  Skipping add_auth_tables.sql (already applied)
2025-11-02T09:10:14.500359718Z [inf]  ⏭️  Skipping add_message_scoring_fields.sql (already applied)
2025-11-02T09:10:14.503149552Z [inf]  ⏭️  Skipping add_moderation_fields.sql (already applied)
2025-11-02T09:10:14.503159448Z [inf]  ⏭️  Skipping add_materialized_views.sql (already applied)
2025-11-02T09:10:14.505979414Z [inf]  ⏭️  Skipping add_advanced_indexes.sql (already applied)
2025-11-02T09:10:14.506116687Z [inf]  ⏭️  Skipping add_critical_indexes.sql (already applied)
2025-11-02T09:10:14.508738272Z [inf]  ⏭️  Skipping add_global_rules.sql (already applied)
2025-11-02T09:10:14.508750953Z [inf]  ⏭️  Skipping add_performance_monitoring.sql (already applied)
2025-11-02T09:10:14.508757779Z [inf]  ⏭️  Skipping add_user_activity_log.sql (already applied)
2025-11-02T09:10:14.511185737Z [inf]  ⏭️  Skipping add_user_global_rules.sql (already applied)
2025-11-02T09:10:14.511196346Z [inf]  ⏭️  Skipping add_user_sessions.sql (already applied)
2025-11-02T09:10:14.511203087Z [inf]  ⏭️  Skipping add_user_settings.sql (already applied)
2025-11-02T09:10:14.513179364Z [inf]  ⏭️  Skipping add_user_spam_rules.sql (already applied)
2025-11-02T09:10:14.513185507Z [inf]  ⏭️  Skipping fix_schema_critical.sql (already applied)
2025-11-02T09:10:14.515873903Z [inf]  ⏭️  Skipping fix_user_id.sql (already applied)
2025-11-02T09:10:14.515886276Z [inf]  ⏭️  Skipping optimize_data_types.sql (already applied)
2025-11-02T09:10:14.515893036Z [inf]  
2025-11-02T09:10:14.515899100Z [inf]  🎉 Migrations completed!
2025-11-02T09:10:14.515903832Z [inf]     ✅ Applied: 0
2025-11-02T09:10:14.515909485Z [inf]     ⏭️  Skipped: 20
2025-11-02T09:10:14.944524043Z [inf]  2025-11-02 09:10:14.934 [[32minfo[39m] ✅ Rate limiter initialized {
2025-11-02T09:10:14.944531334Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:14.944536612Z [inf]    "version": "1.0.0"
2025-11-02T09:10:14.944541295Z [inf]  }
2025-11-02T09:10:14.978781134Z [inf]  2025-11-02 09:10:14.976 [[32minfo[39m] ✅ Metrics initialized {
2025-11-02T09:10:14.978790096Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:14.978796959Z [inf]    "version": "1.0.0"
2025-11-02T09:10:14.978803528Z [inf]  }
2025-11-02T09:10:15.491003519Z [inf]  2025-11-02 09:10:15.478 [[32minfo[39m] ✅ Rate limiter initialized {
2025-11-02T09:10:15.491009282Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:15.491014201Z [inf]    "version": "1.0.0"
2025-11-02T09:10:15.491019485Z [inf]  }
2025-11-02T09:10:15.519925724Z [inf]  2025-11-02 09:10:15.514 [[32minfo[39m] ✅ Metrics initialized {
2025-11-02T09:10:15.519931775Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:15.519943698Z [inf]    "version": "1.0.0"
2025-11-02T09:10:15.519948654Z [inf]  }
2025-11-02T09:10:15.534140084Z [inf]  2025-11-02 09:10:15.531 [[32minfo[39m] Redis client connected for rate limiting {
2025-11-02T09:10:15.534144971Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:15.534151919Z [inf]    "version": "1.0.0"
2025-11-02T09:10:15.534155857Z [inf]  }
2025-11-02T09:10:16.921063094Z [inf]  
2025-11-02T09:10:16.921118832Z [inf]  
2025-11-02T09:10:16.921125089Z [inf]  > mellchat-api@1.0.0 start:with-migrations
2025-11-02T09:10:16.921131036Z [inf]  > NODE_ENV=production sh -c 'node apply-migrations.js && node src/index.js' || node src/index.js
2025-11-02T09:10:17.122566433Z [inf]  ✅ Connected to database on attempt 1
2025-11-02T09:10:17.122577271Z [inf]  ✅ Migrations tracking table ready
2025-11-02T09:10:17.122583105Z [inf]  📂 Migrations directory: /app/database/migrations
2025-11-02T09:10:17.129398408Z [inf]  📝 Found 20 migration files
2025-11-02T09:10:17.136730862Z [inf]  ⏭️  Skipping 01_initial_schema.sql (already applied)
2025-11-02T09:10:17.136737140Z [inf]  ⏭️  Skipping add_guest_sessions.sql (already applied)
2025-11-02T09:10:17.136742727Z [inf]  ⏭️  Skipping add_fingerprint_to_guest_sessions.sql (already applied)
2025-11-02T09:10:17.136748470Z [inf]  ⏭️  Skipping add_auth_users.sql (already applied)
2025-11-02T09:10:17.136753319Z [inf]  ⏭️  Skipping add_auth_tables.sql (already applied)
2025-11-02T09:10:17.138364235Z [inf]  ⏭️  Skipping add_message_scoring_fields.sql (already applied)
2025-11-02T09:10:17.141526573Z [inf]  ⏭️  Skipping add_moderation_fields.sql (already applied)
2025-11-02T09:10:17.141534657Z [inf]  ⏭️  Skipping add_materialized_views.sql (already applied)
2025-11-02T09:10:17.141541349Z [inf]  ⏭️  Skipping add_advanced_indexes.sql (already applied)
2025-11-02T09:10:17.144572194Z [inf]  ⏭️  Skipping add_critical_indexes.sql (already applied)
2025-11-02T09:10:17.144577515Z [inf]  ⏭️  Skipping add_global_rules.sql (already applied)
2025-11-02T09:10:17.145985703Z [inf]  ⏭️  Skipping add_performance_monitoring.sql (already applied)
2025-11-02T09:10:17.145990657Z [inf]  ⏭️  Skipping add_user_activity_log.sql (already applied)
2025-11-02T09:10:17.148334366Z [inf]  ⏭️  Skipping add_user_global_rules.sql (already applied)
2025-11-02T09:10:17.148339048Z [inf]  ⏭️  Skipping add_user_sessions.sql (already applied)
2025-11-02T09:10:17.150235484Z [inf]  ⏭️  Skipping add_user_settings.sql (already applied)
2025-11-02T09:10:17.150241593Z [inf]  ⏭️  Skipping add_user_spam_rules.sql (already applied)
2025-11-02T09:10:17.153599757Z [inf]  ⏭️  Skipping fix_schema_critical.sql (already applied)
2025-11-02T09:10:17.153606126Z [inf]  ⏭️  Skipping fix_user_id.sql (already applied)
2025-11-02T09:10:17.153610778Z [inf]  ⏭️  Skipping optimize_data_types.sql (already applied)
2025-11-02T09:10:17.153617174Z [inf]  
2025-11-02T09:10:17.153621516Z [inf]  🎉 Migrations completed!
2025-11-02T09:10:17.153625933Z [inf]     ✅ Applied: 0
2025-11-02T09:10:17.153630372Z [inf]     ⏭️  Skipped: 20
2025-11-02T09:10:17.947307857Z [inf]  2025-11-02 09:10:17.645 [[32minfo[39m] ✅ Rate limiter initialized {
2025-11-02T09:10:17.947313457Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:17.947417789Z [inf]    "version": "1.0.0"
2025-11-02T09:10:17.947426314Z [inf]  }
2025-11-02T09:10:17.947435678Z [inf]  2025-11-02 09:10:17.684 [[32minfo[39m] ✅ Metrics initialized {
2025-11-02T09:10:17.947441022Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:17.947446959Z [inf]    "version": "1.0.0"
2025-11-02T09:10:17.947453179Z [inf]  }
2025-11-02T09:10:18.202106426Z [inf]  2025-11-02 09:10:18.197 [[32minfo[39m] ✅ Rate limiter initialized {
2025-11-02T09:10:18.202113852Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:18.202120723Z [inf]    "version": "1.0.0"
2025-11-02T09:10:18.202126753Z [inf]  }
2025-11-02T09:10:18.237051285Z [inf]  2025-11-02 09:10:18.235 [[32minfo[39m] ✅ Metrics initialized {
2025-11-02T09:10:18.237057872Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:18.237062444Z [inf]    "version": "1.0.0"
2025-11-02T09:10:18.237066440Z [inf]  }
2025-11-02T09:10:18.256603882Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:18.256612696Z [inf]    "version": "1.0.0"
2025-11-02T09:10:18.256619313Z [inf]  }
2025-11-02T09:10:18.256675252Z [inf]  2025-11-02 09:10:18.253 [[32minfo[39m] Redis client connected for rate limiting {
2025-11-02T09:10:19.546997353Z [inf]  
2025-11-02T09:10:19.547004031Z [inf]  > mellchat-api@1.0.0 start:with-migrations
2025-11-02T09:10:19.547019401Z [inf]  > NODE_ENV=production sh -c 'node apply-migrations.js && node src/index.js' || node src/index.js
2025-11-02T09:10:19.547025985Z [inf]  
2025-11-02T09:10:19.865284598Z [inf]  ⏭️  Skipping add_fingerprint_to_guest_sessions.sql (already applied)
2025-11-02T09:10:19.865289191Z [inf]  ✅ Connected to database on attempt 1
2025-11-02T09:10:19.865294716Z [inf]  ⏭️  Skipping add_auth_users.sql (already applied)
2025-11-02T09:10:19.865294771Z [inf]  ✅ Migrations tracking table ready
2025-11-02T09:10:19.865303800Z [inf]  📂 Migrations directory: /app/database/migrations
2025-11-02T09:10:19.865304120Z [inf]  ⏭️  Skipping add_auth_tables.sql (already applied)
2025-11-02T09:10:19.865313633Z [inf]  ⏭️  Skipping add_message_scoring_fields.sql (already applied)
2025-11-02T09:10:19.865316190Z [inf]  📝 Found 20 migration files
2025-11-02T09:10:19.865322744Z [inf]  ⏭️  Skipping 01_initial_schema.sql (already applied)
2025-11-02T09:10:19.865323362Z [inf]  ⏭️  Skipping add_moderation_fields.sql (already applied)
2025-11-02T09:10:19.865330304Z [inf]  ⏭️  Skipping add_guest_sessions.sql (already applied)
2025-11-02T09:10:19.865333244Z [inf]  ⏭️  Skipping add_materialized_views.sql (already applied)
2025-11-02T09:10:19.865340037Z [inf]  ⏭️  Skipping add_advanced_indexes.sql (already applied)
2025-11-02T09:10:19.865340406Z [inf]  ⏭️  Skipping add_global_rules.sql (already applied)
2025-11-02T09:10:19.865342964Z [inf]  ⏭️  Skipping add_user_global_rules.sql (already applied)
2025-11-02T09:10:19.865347494Z [inf]  ⏭️  Skipping add_performance_monitoring.sql (already applied)
2025-11-02T09:10:19.865347948Z [inf]  ⏭️  Skipping add_critical_indexes.sql (already applied)
2025-11-02T09:10:19.865354425Z [inf]  ⏭️  Skipping add_user_activity_log.sql (already applied)
2025-11-02T09:10:19.865354524Z [inf]  ⏭️  Skipping add_user_sessions.sql (already applied)
2025-11-02T09:10:19.865361249Z [inf]  ⏭️  Skipping add_user_settings.sql (already applied)
2025-11-02T09:10:19.865365768Z [inf]  ⏭️  Skipping add_user_spam_rules.sql (already applied)
2025-11-02T09:10:19.866259704Z [inf]  ⏭️  Skipping fix_schema_critical.sql (already applied)
2025-11-02T09:10:19.866263627Z [inf]  ⏭️  Skipping fix_user_id.sql (already applied)
2025-11-02T09:10:19.866267547Z [inf]  ⏭️  Skipping optimize_data_types.sql (already applied)
2025-11-02T09:10:19.866271736Z [inf]  
2025-11-02T09:10:19.866276720Z [inf]  🎉 Migrations completed!
2025-11-02T09:10:19.866280739Z [inf]     ✅ Applied: 0
2025-11-02T09:10:19.866285207Z [inf]     ⏭️  Skipped: 20
2025-11-02T09:10:20.228516433Z [inf]  2025-11-02 09:10:20.222 [[32minfo[39m] ✅ Rate limiter initialized {
2025-11-02T09:10:20.228520999Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:20.228525611Z [inf]    "version": "1.0.0"
2025-11-02T09:10:20.228530037Z [inf]  }
2025-11-02T09:10:20.262750693Z [inf]  2025-11-02 09:10:20.261 [[32minfo[39m] ✅ Metrics initialized {
2025-11-02T09:10:20.262757546Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:20.262762506Z [inf]    "version": "1.0.0"
2025-11-02T09:10:20.262766623Z [inf]  }
2025-11-02T09:10:20.879050411Z [inf]  }
2025-11-02T09:10:20.879065322Z [inf]    "version": "1.0.0"
2025-11-02T09:10:20.879065805Z [inf]  }
2025-11-02T09:10:20.879074972Z [inf]  }
2025-11-02T09:10:20.879079096Z [inf]  2025-11-02 09:10:20.804 [[32minfo[39m] Redis client connected for rate limiting {
2025-11-02T09:10:20.879086109Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:20.879093975Z [inf]    "version": "1.0.0"
2025-11-02T09:10:20.879097178Z [inf]  2025-11-02 09:10:20.788 [[32minfo[39m] ✅ Metrics initialized {
2025-11-02T09:10:20.879099728Z [inf]  2025-11-02 09:10:20.750 [[32minfo[39m] ✅ Rate limiter initialized {
2025-11-02T09:10:20.879106315Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:20.879110310Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:20.879117505Z [inf]    "version": "1.0.0"
2025-11-02T09:10:22.001581249Z [inf]  
2025-11-02T09:10:22.001588832Z [inf]  > mellchat-api@1.0.0 start:with-migrations
2025-11-02T09:10:22.001596147Z [inf]  > NODE_ENV=production sh -c 'node apply-migrations.js && node src/index.js' || node src/index.js
2025-11-02T09:10:22.001604165Z [inf]  
2025-11-02T09:10:22.310837542Z [inf]  ✅ Connected to database on attempt 1
2025-11-02T09:10:22.312582447Z [inf]  ✅ Migrations tracking table ready
2025-11-02T09:10:22.312589092Z [inf]  📂 Migrations directory: /app/database/migrations
2025-11-02T09:10:22.328445294Z [inf]  📝 Found 20 migration files
2025-11-02T09:10:22.328452571Z [inf]  ⏭️  Skipping 01_initial_schema.sql (already applied)
2025-11-02T09:10:22.328457536Z [inf]  ⏭️  Skipping add_guest_sessions.sql (already applied)
2025-11-02T09:10:22.330191850Z [inf]  ⏭️  Skipping add_fingerprint_to_guest_sessions.sql (already applied)
2025-11-02T09:10:22.330200065Z [inf]  ⏭️  Skipping add_auth_users.sql (already applied)
2025-11-02T09:10:22.332104872Z [inf]  ⏭️  Skipping add_auth_tables.sql (already applied)
2025-11-02T09:10:22.334265751Z [inf]  ⏭️  Skipping add_message_scoring_fields.sql (already applied)
2025-11-02T09:10:22.334272784Z [inf]  ⏭️  Skipping add_moderation_fields.sql (already applied)
2025-11-02T09:10:22.336566870Z [inf]  ⏭️  Skipping add_materialized_views.sql (already applied)
2025-11-02T09:10:22.336572986Z [inf]  ⏭️  Skipping add_advanced_indexes.sql (already applied)
2025-11-02T09:10:22.338493007Z [inf]  ⏭️  Skipping add_critical_indexes.sql (already applied)
2025-11-02T09:10:22.338498810Z [inf]  ⏭️  Skipping add_global_rules.sql (already applied)
2025-11-02T09:10:22.340216868Z [inf]  ⏭️  Skipping add_performance_monitoring.sql (already applied)
2025-11-02T09:10:22.340235172Z [inf]  ⏭️  Skipping add_user_activity_log.sql (already applied)
2025-11-02T09:10:22.342171042Z [inf]  ⏭️  Skipping add_user_global_rules.sql (already applied)
2025-11-02T09:10:22.342178437Z [inf]  ⏭️  Skipping add_user_sessions.sql (already applied)
2025-11-02T09:10:22.344193313Z [inf]  ⏭️  Skipping add_user_settings.sql (already applied)
2025-11-02T09:10:22.344201141Z [inf]  ⏭️  Skipping add_user_spam_rules.sql (already applied)
2025-11-02T09:10:22.346184281Z [inf]  ⏭️  Skipping fix_schema_critical.sql (already applied)
2025-11-02T09:10:22.346194745Z [inf]  ⏭️  Skipping fix_user_id.sql (already applied)
2025-11-02T09:10:22.347976154Z [inf]  ⏭️  Skipping optimize_data_types.sql (already applied)
2025-11-02T09:10:22.347985346Z [inf]  
2025-11-02T09:10:22.347990964Z [inf]  🎉 Migrations completed!
2025-11-02T09:10:22.347995912Z [inf]     ✅ Applied: 0
2025-11-02T09:10:22.348000588Z [inf]     ⏭️  Skipped: 20
2025-11-02T09:10:22.911313510Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:22.911322899Z [inf]    "version": "1.0.0"
2025-11-02T09:10:22.911328372Z [inf]  }
2025-11-02T09:10:22.911335229Z [inf]  2025-11-02 09:10:22.772 [[32minfo[39m] ✅ Metrics initialized {
2025-11-02T09:10:22.911341101Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:22.911345859Z [inf]    "version": "1.0.0"
2025-11-02T09:10:22.911350332Z [inf]  }
2025-11-02T09:10:22.911413945Z [inf]  2025-11-02 09:10:22.735 [[32minfo[39m] ✅ Rate limiter initialized {
2025-11-02T09:10:23.348417007Z [inf]  2025-11-02 09:10:23.326 [[32minfo[39m] ✅ Rate limiter initialized {
2025-11-02T09:10:23.348428995Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:23.348435402Z [inf]    "version": "1.0.0"
2025-11-02T09:10:23.348473376Z [inf]  }
2025-11-02T09:10:23.375277896Z [inf]  2025-11-02 09:10:23.371 [[32minfo[39m] ✅ Metrics initialized {
2025-11-02T09:10:23.375283324Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:23.375287397Z [inf]    "version": "1.0.0"
2025-11-02T09:10:23.375291198Z [inf]  }
2025-11-02T09:10:23.402234734Z [inf]  2025-11-02 09:10:23.391 [[32minfo[39m] Redis client connected for rate limiting {
2025-11-02T09:10:23.402238938Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:23.402243510Z [inf]    "version": "1.0.0"
2025-11-02T09:10:23.402247964Z [inf]  }
2025-11-02T09:10:24.564232931Z [inf]  
2025-11-02T09:10:24.564240377Z [inf]  > mellchat-api@1.0.0 start:with-migrations
2025-11-02T09:10:24.564245512Z [inf]  > NODE_ENV=production sh -c 'node apply-migrations.js && node src/index.js' || node src/index.js
2025-11-02T09:10:24.564250222Z [inf]  
2025-11-02T09:10:24.873290052Z [inf]  ⏭️  Skipping add_global_rules.sql (already applied)
2025-11-02T09:10:24.873301669Z [inf]  ⏭️  Skipping add_performance_monitoring.sql (already applied)
2025-11-02T09:10:24.873338200Z [inf]  📝 Found 20 migration files
2025-11-02T09:10:24.873354064Z [inf]  ⏭️  Skipping 01_initial_schema.sql (already applied)
2025-11-02T09:10:24.873363856Z [inf]  ⏭️  Skipping add_guest_sessions.sql (already applied)
2025-11-02T09:10:24.873375526Z [inf]  ⏭️  Skipping add_fingerprint_to_guest_sessions.sql (already applied)
2025-11-02T09:10:24.873387888Z [inf]  ⏭️  Skipping add_auth_users.sql (already applied)
2025-11-02T09:10:24.873401802Z [inf]  ⏭️  Skipping add_auth_tables.sql (already applied)
2025-11-02T09:10:24.873409951Z [inf]  ⏭️  Skipping add_message_scoring_fields.sql (already applied)
2025-11-02T09:10:24.873417683Z [inf]  ⏭️  Skipping add_moderation_fields.sql (already applied)
2025-11-02T09:10:24.873426040Z [inf]  ⏭️  Skipping add_materialized_views.sql (already applied)
2025-11-02T09:10:24.873434320Z [inf]  ⏭️  Skipping add_advanced_indexes.sql (already applied)
2025-11-02T09:10:24.873443495Z [inf]  ⏭️  Skipping add_critical_indexes.sql (already applied)
2025-11-02T09:10:24.873500248Z [inf]  ✅ Connected to database on attempt 1
2025-11-02T09:10:24.873505912Z [inf]  ✅ Migrations tracking table ready
2025-11-02T09:10:24.873511176Z [inf]  📂 Migrations directory: /app/database/migrations
2025-11-02T09:10:24.873891740Z [inf]  ⏭️  Skipping add_user_activity_log.sql (already applied)
2025-11-02T09:10:24.873896113Z [inf]  ⏭️  Skipping add_user_global_rules.sql (already applied)
2025-11-02T09:10:24.875927943Z [inf]  ⏭️  Skipping add_user_settings.sql (already applied)
2025-11-02T09:10:24.875937021Z [inf]  ⏭️  Skipping add_user_spam_rules.sql (already applied)
2025-11-02T09:10:24.876029134Z [inf]  ⏭️  Skipping add_user_sessions.sql (already applied)
2025-11-02T09:10:24.877277895Z [inf]  ⏭️  Skipping fix_schema_critical.sql (already applied)
2025-11-02T09:10:24.879454176Z [inf]  ⏭️  Skipping fix_user_id.sql (already applied)
2025-11-02T09:10:24.879464377Z [inf]  ⏭️  Skipping optimize_data_types.sql (already applied)
2025-11-02T09:10:24.879471694Z [inf]  
2025-11-02T09:10:24.879478821Z [inf]  🎉 Migrations completed!
2025-11-02T09:10:24.879485623Z [inf]     ✅ Applied: 0
2025-11-02T09:10:24.879492065Z [inf]     ⏭️  Skipped: 20
2025-11-02T09:10:25.296062365Z [inf]  2025-11-02 09:10:25.283 [[32minfo[39m] ✅ Rate limiter initialized {
2025-11-02T09:10:25.296067057Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:25.296071113Z [inf]    "version": "1.0.0"
2025-11-02T09:10:25.296076154Z [inf]  }
2025-11-02T09:10:25.340316180Z [inf]  2025-11-02 09:10:25.322 [[32minfo[39m] ✅ Metrics initialized {
2025-11-02T09:10:25.340321156Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:25.340326624Z [inf]    "version": "1.0.0"
2025-11-02T09:10:25.340331098Z [inf]  }
2025-11-02T09:10:25.930887977Z [inf]  2025-11-02 09:10:25.823 [[32minfo[39m] ✅ Rate limiter initialized {
2025-11-02T09:10:25.930895073Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:25.930902165Z [inf]    "version": "1.0.0"
2025-11-02T09:10:25.930908655Z [inf]  }
2025-11-02T09:10:25.930915474Z [inf]  2025-11-02 09:10:25.862 [[32minfo[39m] ✅ Metrics initialized {
2025-11-02T09:10:25.930922440Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:25.930932157Z [inf]    "version": "1.0.0"
2025-11-02T09:10:25.930940362Z [inf]  }
2025-11-02T09:10:25.930947550Z [inf]  2025-11-02 09:10:25.879 [[32minfo[39m] Redis client connected for rate limiting {
2025-11-02T09:10:25.930955030Z [inf]    "service": "mellchat-api",
2025-11-02T09:10:25.930961984Z [inf]    "version": "1.0.0"
2025-11-02T09:10:25.930969341Z [inf]  }