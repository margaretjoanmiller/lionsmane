local key = KEYS[1]
local crawl_delay = tonumber(ARGV[1])
local number_of_jobs = tonumber(ARGV[2])

local next_slot = tonumber(server.call('GET', key) or 0)


local current_time = server.call('TIME')
local current_time_ms = (tonumber(current_time[1]) * 1000) + math.floor(tonumber(current_time[2] / 1000))

local starting_point_ms = math.max(current_time_ms, next_slot)

local new_end_slot = starting_point_ms + (number_of_jobs * crawl_delay)
server.call('SET', key, new_end_slot)

return starting_point_ms
