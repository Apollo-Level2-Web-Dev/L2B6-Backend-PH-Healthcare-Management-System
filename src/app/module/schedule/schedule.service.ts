import { addHours, addMinutes, format } from "date-fns";
import { Prisma, Schedule } from "../../../generated/prisma/client";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { scheduleFilterableFields, scheduleIncludeConfig, scheduleSearchableFields } from "./schedule.constant";
import { ICreateSchedulePayload, IUpdateSchedulePayload } from "./schedule.interface";
import { convertDateTime } from "./schedule.utils";

const createSchedule = async (payload: ICreateSchedulePayload) =>{
    const { startDate, endDate, startTime, endTime } = payload;

    const interval = 30;

    const currentDate = new Date(startDate);
    const lastDate = new Date(endDate);

    const schedules = [];

    while (currentDate <= lastDate) {
        const startDateTime = new Date(
            addMinutes(
                addHours(
                    `${format(currentDate, "yyyy-MM-dd")}`,
                    Number(startTime.split(":")[0])
                ),
                Number(startTime.split(":")[1])
            )
        );

        const endDateTime = new Date(
            addMinutes(
                addHours(
                    `${format(currentDate, "yyyy-MM-dd")}`,
                    Number(endTime.split(":")[0])
                ),
                Number(endTime.split(":")[1])
            )
        );

        while (startDateTime < endDateTime) {
            const s = await convertDateTime(startDateTime);
            const e = await convertDateTime(addMinutes(startDateTime, interval));

            const scheduleData = {
                startDateTime: s,
                endDateTime: e
            }

            const existingSchedule = await prisma.schedule.findFirst({
                where: {
                    startDateTime: scheduleData.startDateTime,
                    endDateTime: scheduleData.endDateTime
                }
            })

            if (!existingSchedule) {
                const result = await prisma.schedule.create({
                    data: scheduleData
                })
                console.log(result);
                schedules.push(result);
            }

            startDateTime.setMinutes(startDateTime.getMinutes() + interval)
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return schedules;
}

const getAllSchedules = async (query : IQueryParams) => {
    const queryBuilder = new QueryBuilder<Schedule, Prisma.ScheduleWhereInput, Prisma.ScheduleInclude>(
        prisma.schedule,
        query,
        {
            searchableFields: scheduleSearchableFields,
            filterableFields:scheduleFilterableFields
        }
    )

    const result = await queryBuilder
    .search()
    .filter()
    .paginate()
    .dynamicInclude(scheduleIncludeConfig)
    .sort()
    .fields()
    .execute();

    return result;
}

const getScheduleById = async (id: string) => {
    const schedule = await prisma.schedule.findUnique({
        where: {
            id: id
        }
    });
    return schedule;
}

// refactoring - doctor's appointment or booked slot conflict check
const updateSchedule = async (id: string, payload: IUpdateSchedulePayload) => {
    const { startDate, endDate, startTime, endTime } = payload;
    const startDateTime = new Date(
        addMinutes(
            addHours(
                `${format(new Date(startDate), 'yyyy-MM-dd')}`,
                Number(startTime.split(':')[0])
            ),
            Number(startTime.split(':')[1])
        )
    );

    const endDateTime = new Date(
        addMinutes(
            addHours(
                `${format(new Date(endDate), 'yyyy-MM-dd')}`,
                Number(endTime.split(':')[0])
            ),
            Number(endTime.split(':')[1])
        )
    );

    const updatedSchedule = await prisma.schedule.update({
        where: {
            id: id
        },
        data: {
            startDateTime: startDateTime,
            endDateTime: endDateTime
        }
    });

    return updatedSchedule;
}

const deleteSchedule = async (id: string) => {
    await prisma.schedule.delete({
        where: {
            id: id
        }
    });
    return true;
}

export const ScheduleService = {
    createSchedule,
    getAllSchedules,
    getScheduleById,
    updateSchedule,
    deleteSchedule
}